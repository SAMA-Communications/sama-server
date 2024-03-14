import RuntimeDefinedContext from '../store/RuntimeDefinedContext.js'

import ServiceLocatorContainer from '@sama/common/ServiceLocatorContainer.js'

import operationsLogRepository from '../repositories/operations_log_repository.js'

import clusterManager from '../cluster/cluster_manager.js'
import packetMapper from './packet_mapper.js'

import { buildWsEndpoint } from '../utils/build_ws_endpoint.js'
import { getIpFromWsUrl } from '../utils/get_ip_from_ws_url.js'

class PacketManager {
  async deliverToUserOnThisNode(ws, userId, packet, deviceId, senderInfo) {
    const sessionService = ServiceLocatorContainer.use('SessionService')
    const activeDevices = sessionService.getUserDevices(userId)

    const wsRecipient = deviceId
      ? [activeDevices.find((obj) => obj.deviceId === deviceId)]
      : activeDevices

    for (const recipient of wsRecipient) {
      try {
        const mappedMessage = await packetMapper.mapPacket(ws?.apiType, recipient.ws?.apiType, packet, senderInfo)
        recipient.ws.send(mappedMessage)
      } catch (err) {
        console.error(`[PacketProcessor] send on socket error`, err)
      }
    }
  }

  #deliverToUserDevices(ws, nodeConnections, userId, packet) {
    const sessionService = ServiceLocatorContainer.use('SessionService')
    const senderUserSession = sessionService.getSession(ws)

    const currentNodeUrl = buildWsEndpoint(
      RuntimeDefinedContext.APP_IP,
      RuntimeDefinedContext.CLUSTER_PORT
    )

    const senderInfo = { apiType: ws?.apiType, session: senderUserSession, node: currentNodeUrl }

    nodeConnections.forEach(async (data) => {
      const nodeInfo = JSON.parse(data)
      const nodeUrl = nodeInfo[Object.keys(nodeInfo)[0]]
      const nodeDeviceId = Object.keys(nodeInfo)[0]

      const currentDeviceId = sessionService.getDeviceId(ws, userId)

      if (currentNodeUrl === nodeUrl) {
        if (currentDeviceId !== nodeDeviceId) {
          await this.deliverToUserOnThisNode(ws, userId, packet, nodeDeviceId, senderInfo) // carbon message
        }
        return
      }

      try {
        const clusterPacket = { userId, packet, senderInfo }
        await clusterManager.senderClusterDeliverPacket(nodeUrl, clusterPacket)
      } catch (err) {
        await sessionService.clearNodeUsersSession(nodeUrl)
        console.error('[PacketProcessor][deliverToUserDevices] createSocketWithNode error', err)
      }
    })
  }

  async deliverToUserOrUsers(ws, packet, pushQueueMessage, usersIds, notSaveInOfflineStorage) {
    const sessionService = ServiceLocatorContainer.use('SessionService')

    if (!usersIds?.length) {
      return
    }

    const offlineUsersByPackets = []

    for (const userId of usersIds) {
      const userNodeData = await sessionService.getUserNodeData(userId)

      if (!userNodeData?.length) {
        if (!notSaveInOfflineStorage) {
          operationsLogRepository.savePacket(userId, packet)
        }

        offlineUsersByPackets.push(userId)
        continue
      }

      this.#deliverToUserDevices(ws, userNodeData, userId, packet)
    }

    if (pushQueueMessage && offlineUsersByPackets.length) {
      pushQueueMessage.setRecipientIds(offlineUsersByPackets)
      await RuntimeDefinedContext.PUSH_QUEUE_DRIVER.createPush(pushQueueMessage)
    }
  }

  async deliverClusterMessageToUser(deliverPacket) {
    try {
      const { userId, packet, senderInfo } = deliverPacket
      await this.deliverToUserOnThisNode({ apiType: senderInfo?.apiType }, userId, packet, senderInfo)
    } catch (err) {
      console.error('[cluster_manager][deliverClusterMessageToUser] error', err)
    }
  }
}

export default new PacketManager()
