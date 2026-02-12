import config from "../config/index.js"
import maiLogger from "../logger/index.js"

import ServiceLocatorContainer from "@sama/common/ServiceLocatorContainer.js"

import clusterManager from "../cluster/cluster_manager.js"
import packetMapper from "./packet_mapper.js"

import { CONSTANTS as MAIN_CONSTANTS } from "../constants/constants.js"

const logger = maiLogger.child("[PacketManager]")

class PacketManager {
  async deliverToUserOnThisNode(userId, packet, deviceId, senderInfo) {
    const sessionService = ServiceLocatorContainer.use("SessionService")
    let activeDevices = sessionService
      .getUserDevices(userId)
      .filter((activeDevice) => activeDevice?.deviceId !== MAIN_CONSTANTS.HTTP_DEVICE_ID)

    if (deviceId) {
      activeDevices = activeDevices.filter(recipient => recipient?.deviceId === deviceId)
    }

    activeDevices = activeDevices.filter(recipient => !!recipient?.socket)

    for (const recipient of activeDevices) {
      try {
        const recipientInfo = {
          apiType: recipient.socket?.apiType,
          session: sessionService.getSession(recipient.socket),
          deviceId: recipient.deviceId,
        }

        let mappedMessage = await packetMapper.mapPacket(senderInfo.apiType, recipient.socket?.apiType, packet, senderInfo, recipientInfo)

        if (!mappedMessage) {
          continue
        }

        if (!Array.isArray(mappedMessage)) {
          mappedMessage = [mappedMessage]
        }

        for (const message of mappedMessage) {
          const mappedRecipientMessage = await packetMapper.mapRecipientPacket(recipient.socket?.apiType, message, senderInfo, recipientInfo)

          await recipient.socket?.safeSend(mappedRecipientMessage)
        }
      } catch (error) {
        logger.error(error, `send on socket error`)
      }
    }
  }

  #deliverToUserDevices(socket, nodeConnections, userId, packet, ignoreSelf) {
    const sessionService = ServiceLocatorContainer.use("SessionService")
    const senderUserSession = sessionService.getSession(socket)
    const senderDeviceId = senderUserSession ? sessionService.getDeviceId(socket, senderUserSession.userId) : null

    const currentNodeUrl = config.get("ws.cluster.endpoint")

    const senderInfo = {
      apiType: socket?.apiType,
      session: senderUserSession,
      deviceId: senderDeviceId,
      node: currentNodeUrl,
    }

    if (config.get("app.isStandAloneNode")) {
      Object.keys(nodeConnections).forEach(async nodeDeviceId => {
        if (senderDeviceId === nodeDeviceId && ignoreSelf) {
          return // carbon message
        }
  
        await this.deliverToUserOnThisNode(userId, packet, nodeDeviceId, senderInfo)
      })
    } else {
      Object.entries(nodeConnections).forEach(async ([nodeDeviceId, extraParams]) => {
        const nodeUrl = extraParams[MAIN_CONSTANTS.SESSION_NODE_KEY]
  
        if (!nodeUrl) {
          return
        }
  
        if (currentNodeUrl === nodeUrl) {
          if (senderDeviceId === nodeDeviceId && ignoreSelf) {
            return
          }
  
          await this.deliverToUserOnThisNode(userId, packet, nodeDeviceId, senderInfo) // carbon message
  
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
  }

  async deliverToUserOrUsers(orgId, socket, packet, pushQueueMessage, usersIds, notSaveInOfflineStorage, ignoreSelf) {
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

      this.#deliverToUserDevices(socket, userNodeData, userId, packet, ignoreSelf)
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
