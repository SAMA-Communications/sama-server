import config from "../config/index.js"
import maiLogger from "../logger/index.js"

import ServiceLocatorContainer from "@sama/common/ServiceLocatorContainer.js"

import clusterManager from "../cluster/cluster_manager.js"
import packetMapper from "./packet_mapper.js"

import { CONSTANTS as MAIN_CONSTANTS } from "../constants/constants.js"

const logger = maiLogger.child("[PacketManager]")

class PacketManager {
  async deliverToUserOnThisNode(userId, packet, deviceId, senderInfo) {
    const currentNodeUrl = config.get("ws.cluster.endpoint")
    const sessionService = ServiceLocatorContainer.use("SessionService")
    const activeDevices = sessionService
      .getUserDevices(userId)
      .filter((activeDevice) => activeDevice?.deviceId !== MAIN_CONSTANTS.HTTP_DEVICE_ID)

    const wsRecipient = deviceId ? [activeDevices.find((obj) => obj.deviceId === deviceId)] : activeDevices

    for (const recipient of wsRecipient) {
      try {
        const recipientInfo = {
          apiType: recipient.ws?.apiType,
          session: sessionService.getSession(recipient.ws),
          deviceId: recipient.deviceId,
          node: currentNodeUrl,
        }

        let mappedMessage = await packetMapper.mapPacket(senderInfo.apiType, recipient.ws?.apiType, packet, senderInfo, recipientInfo)

        if (!mappedMessage) {
          continue
        }

        if (!Array.isArray(mappedMessage)) {
          mappedMessage = [mappedMessage]
        }

        for (const message of mappedMessage) {
          const mappedRecipientMessage = await packetMapper.mapRecipientPacket(recipient.ws?.apiType, message, senderInfo, recipientInfo)

          await recipient.ws.safeSend(mappedRecipientMessage)
        }
      } catch (error) {
        logger.error(error, `send on socket error`)
      }
    }
  }

  #deliverToUserDevices(ws, nodeConnections, userId, packet, ignoreSelf) {
    const sessionService = ServiceLocatorContainer.use("SessionService")
    const senderUserSession = sessionService.getSession(ws)
    const senderDeviceId = senderUserSession ? sessionService.getDeviceId(ws, senderUserSession.userId) : null

    const currentNodeUrl = config.get("ws.cluster.endpoint")

    const senderInfo = {
      apiType: ws?.apiType,
      session: senderUserSession,
      deviceId: senderDeviceId,
      node: currentNodeUrl,
    }

    Object.entries(nodeConnections).forEach(async ([nodeDeviceId, extraParams]) => {
      const nodeUrl = extraParams[MAIN_CONSTANTS.SESSION_NODE_KEY]

      if (currentNodeUrl === nodeUrl) {
        if (senderDeviceId === nodeDeviceId && ignoreSelf) {
          return
        }

        await this.deliverToUserOnThisNode(userId, packet, nodeDeviceId, senderInfo, ignoreSelf) // carbon message

        return
      }

      try {
        const clusterPacket = { userId, packet, senderInfo }
        await clusterManager.senderClusterDeliverPacket(nodeUrl, clusterPacket)
      } catch (error) {
        await sessionService.clearNodeUsersSession(nodeUrl)
        logger.error(error, "[deliverToUserDevices] createSocketWithNode error")
      }
    })
  }

  async deliverToUserOrUsers(orgId, ws, packet, pushQueueMessage, usersIds, notSaveInOfflineStorage, ignoreSelf) {
    const sessionService = ServiceLocatorContainer.use("SessionService")
    const opLogsService = ServiceLocatorContainer.use("OperationLogsService")
    const pushQueueService = ServiceLocatorContainer.use("PushQueueService")

    if (!usersIds?.length) {
      return
    }

    const offlineUsersByPackets = []

    for (const userId of usersIds) {
      const userNodeData = await sessionService.listUserData(orgId, userId)
      const isNoConnections = !userNodeData || !Object.keys(userNodeData).length

      if (isNoConnections) {
        if (!notSaveInOfflineStorage) {
          opLogsService.savePacket(userId, packet)
        }

        offlineUsersByPackets.push(userId)
        continue
      }

      const isInactive = Object.values(userNodeData).some((extraParams) => sessionService.isUserInactive(null, extraParams))

      if (isInactive) {
        offlineUsersByPackets.push(userId)
      }

      this.#deliverToUserDevices(ws, userNodeData, userId, packet, ignoreSelf)
    }

    if (pushQueueMessage && offlineUsersByPackets.length) {
      pushQueueMessage.setRecipientIds(offlineUsersByPackets)
      await pushQueueService.createPush(pushQueueMessage)
    }
  }

  async deliverClusterMessageToUser(deliverPacket) {
    try {
      const { userId, packet, senderInfo } = deliverPacket
      await this.deliverToUserOnThisNode(userId, packet, null, senderInfo)
    } catch (error) {
      logger.error(error, "[deliverClusterMessageToUser]")
    }
  }
}

export default new PacketManager()
