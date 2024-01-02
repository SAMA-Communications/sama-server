import ip from 'ip'

import { ACTIVE } from '../store/session.js'

import OpLog from '../models/operations_log.js'

import pushNotificationsRepository from '../repositories/push_notifications_repository.js'
import operationsLogRepository from '../repositories/operations_log_repository.js'
import sessionRepository from '../repositories/session_repository.js'

import clusterManager from '../cluster/cluster_manager.js'
import packetMapper from './packet_mapper.js'

import { buildWsEndpoint } from '../utils/build_ws_endpoint.js'
import { getIpFromWsUrl } from '../utils/get_ip_from_ws_url.js'

class PacketManager {
  constructor() {

  }

  async deliverToUserOnThisNode(ws, userId, packet, deviceId, notSaveInOfflineStorage) {
    const activeDevices = ACTIVE.DEVICES[userId] 

    if (!activeDevices && !notSaveInOfflineStorage) {
      operationsLogRepository.savePacket(userId, packet)
      return
    }

    const wsRecipient = deviceId
      ? [activeDevices.find((obj) => obj.deviceId === deviceId)]
      : activeDevices

    for (const recipient of wsRecipient) {
      try {
        const mappedMessage = await packetMapper.mapPacket(ws?.apiType, recipient.ws?.apiType, packet)
        recipient.ws.send(mappedMessage)
      } catch (err) {
        console.error(`[PacketProcessor] send on socket error`, err)
      }
    }
  }

  #deliverToUserDevices(ws, nodeConnections, userId, packet, notSaveInOfflineStorage) {
    nodeConnections.forEach(async (data) => {
      const nodeInfo = JSON.parse(data)
      const nodeUrl = nodeInfo[Object.keys(nodeInfo)[0]]
      const nodeDeviceId = Object.keys(nodeInfo)[0]
      const currentDeviceId = sessionRepository.getDeviceId(ws, userId)

      this.currentNodeUrl = buildWsEndpoint(
        ip.address(),
        clusterManager.clusterPort
      )
      if (nodeUrl === this.currentNodeUrl) {
        nodeDeviceId !== currentDeviceId &&
          (await this.deliverToUserOnThisNode(
            ws,
            userId,
            packet,
            nodeDeviceId,
            notSaveInOfflineStorage
          ))
      } else {
        const recipientClusterNodeWS =
          clusterManager.clusterNodesWS[getIpFromWsUrl(nodeUrl)]
        if (!recipientClusterNodeWS) {
          try {
            // force create connection with cluster node
            const recClusterNodeWs = await clusterManager.createSocketWithNode(
              getIpFromWsUrl(nodeUrl),
              nodeUrl.split(':')[2]
            )
            recClusterNodeWs.send(JSON.stringify({ userId, message: packet, notSaveInOfflineStorage}))
          } catch (err) {
            console.error(
              '[PacketProcessor][deliverToUserDevices] createSocketWithNode error',
              err.slice(39)
            )

            await sessionRepository.clearNodeUsersSession(nodeUrl)
            if (!notSaveInOfflineStorage) {
              operationsLogRepository.savePacket(userId, packet)
            }
          }
          return
        }

        try {
          recipientClusterNodeWS.send(
            JSON.stringify({ userId, message: packet })
          )
        } catch (err) {
          await sessionRepository.clearNodeUsersSession(nodeUrl)
          if (!notSaveInOfflineStorage) {
            operationsLogRepository.savePacket(userId, packet)
          }
        }
      }
    })
  }

  async deliverToUserOrUsers(ws, packet, usersIds, notSaveInOfflineStorage) {
    if (!usersIds?.length) {
      return
    }

    const offlineUsersByPackets = []
    const pushMessage = packet.pushMessage
    delete packet.pushMessage

    for (const userId of usersIds) {
      const userNodeData = await sessionRepository.getUserNodeData(userId)

      if (!userNodeData?.length) {
        if (!notSaveInOfflineStorage) {
          operationsLogRepository.savePacket(userId, packet)
        }

        offlineUsersByPackets.push(userId)
        continue
      }
      this.#deliverToUserDevices(ws, userNodeData, userId, packet, notSaveInOfflineStorage)
    }

    if (offlineUsersByPackets.length && pushMessage) {
      await pushNotificationsRepository.addPushNotificationToQueue(
        offlineUsersByPackets,
        pushMessage
      )
    }
  }

  async deliverClusterMessageToUser(userId, packet, notSaveInOfflineStorage) {
    try {
      await this.deliverToUserOnThisNode(null, userId, packet, notSaveInOfflineStorage)
    } catch (err) {
      console.error(
        '[cluster_manager][deliverClusterMessageToUser] error',
        err
      )
      if (!notSaveInOfflineStorage) {
        operationsLogRepository.savePacket(userId, packet)
      }
    }
  }
}

export default new PacketManager()
