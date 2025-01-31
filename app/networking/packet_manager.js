import RuntimeDefinedContext from "../store/RuntimeDefinedContext.js"

import ServiceLocatorContainer from "@sama/common/ServiceLocatorContainer.js"

import clusterManager from "../cluster/cluster_manager.js"
import packetMapper from "./packet_mapper.js"

import { buildWsEndpoint } from "../utils/build_ws_endpoint.js"
import { CONSTANTS } from "../constants/constants.js"

class PacketManager {
  async deliverToUserOnThisNode(ws, userId, packet, deviceId, senderInfo) {
    const currentNodeUrl = buildWsEndpoint(RuntimeDefinedContext.APP_IP, RuntimeDefinedContext.CLUSTER_PORT)
    const sessionService = ServiceLocatorContainer.use("SessionService")
    const activeDevices = sessionService.getUserDevices(userId)

    const wsRecipient = deviceId ? [activeDevices.find((obj) => obj.deviceId === deviceId)] : activeDevices

    for (const recipient of wsRecipient) {
      try {
        const recipientInfo = {
          apiType: recipient.ws?.apiType,
          session: sessionService.getSession(recipient.ws),
          deviceId: recipient.deviceId,
          node: currentNodeUrl,
        }

        const mappedMessage = await packetMapper.mapPacket(
          ws?.apiType,
          recipient.ws?.apiType,
          packet,
          senderInfo,
          recipientInfo
        )

        if (!mappedMessage) {
          continue
        }

        if (Array.isArray(mappedMessage)) {
          for (const message of mappedMessage) {
            recipient.ws.send(message)
          }
        } else {
          recipient.ws.send(mappedMessage)
        }
      } catch (err) {
        console.error(`[PacketProcessor] send on socket error`, err)
      }
    }
  }

  #deliverToUserDevices(ws, nodeConnections, userId, packet) {
    const sessionService = ServiceLocatorContainer.use("SessionService")
    const senderUserSession = sessionService.getSession(ws)
    const senderDeviceId = senderUserSession ? sessionService.getDeviceId(ws, senderUserSession.userId) : null

    const currentDeviceId = sessionService.getDeviceId(ws, userId)
    const currentNodeUrl = buildWsEndpoint(RuntimeDefinedContext.APP_IP, RuntimeDefinedContext.CLUSTER_PORT)

    const senderInfo = {
      apiType: ws?.apiType,
      session: senderUserSession,
      deviceId: senderDeviceId,
    }

    Object.entries(nodeConnections).forEach(async ([nodeDeviceId, extraParams]) => {
      const nodeUrl = extraParams[CONSTANTS.SESSION_NODE_KEY]
      senderInfo.node = nodeUrl

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
        console.error("[PacketProcessor][deliverToUserDevices] createSocketWithNode error", err)
      }
    })
  }

  async deliverToUserOrUsers(ws, packet, pushQueueMessage, usersIds, notSaveInOfflineStorage) {
    const sessionService = ServiceLocatorContainer.use("SessionService")
    const opLogsService = ServiceLocatorContainer.use("OperationLogsService")

    if (!usersIds?.length) {
      return
    }

    const offlineUsersByPackets = []

    for (const userId of usersIds) {
      const userNodeData = await sessionService.listUserData(userId)
      const isNoConnections = !userNodeData || !Object.keys(userNodeData).length

      if (isNoConnections) {
        if (!notSaveInOfflineStorage) {
          opLogsService.savePacket(userId, packet)
        }

        offlineUsersByPackets.push(userId)
        continue
      }

      const isInactive = Object.values(userNodeData).some((extraParams) =>
        sessionService.isUserInactive(ws, extraParams)
      )
      if (isInactive) {
        offlineUsersByPackets.push(userId)
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
      await this.deliverToUserOnThisNode({ apiType: senderInfo?.apiType }, userId, packet, null, senderInfo)
    } catch (err) {
      console.error("[cluster_manager][deliverClusterMessageToUser] error", err)
    }
  }
}

export default new PacketManager()
