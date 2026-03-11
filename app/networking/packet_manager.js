import config from "../config/index.js"
import maiLogger from "../logger/index.js"

import ServiceLocatorContainer from "@sama/common/ServiceLocatorContainer.js"

import clusterManager from "../cluster/cluster_manager.js"
import packetMapper from "./packet_mapper.js"

import { CONSTANTS as MAIN_CONSTANTS } from "../constants/constants.js"

const logger = maiLogger.child("[PacketManager]")

class PacketManager {
  async deliverToUserOnThisNode(userId, exceptDeviceId, packet, senderInfo) {
    const sessionService = ServiceLocatorContainer.use("SessionService")
    const activeDevices = sessionService
      .getUserDevices(userId)
      .filter((activeDevice) => activeDevice?.deviceId !== MAIN_CONSTANTS.HTTP_DEVICE_ID)
      .filter((activeDevice) => !!activeDevice?.socket)
      .filter((activeDevice) => activeDevice?.deviceId !== exceptDeviceId)

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
          const mappedRecipientMessage = await packetMapper.mapRecipientPacket(
            recipient.socket?.apiType,
            message,
            senderInfo,
            recipientInfo
          )

          await recipient.socket?.safeSend(mappedRecipientMessage)
        }
      } catch (error) {
        logger.error(error, `send on socket error`)
      }
    }
  }

  // async deliverToUserOrUsers(orgId, socket, packet, pushQueueMessage, usersIds, notSaveInOfflineStorage, ignoreSelf)
  async deliverToUserOrUsers(sourceOptions, destinationUserIds, payloadOptions) {
    const sessionService = ServiceLocatorContainer.use("SessionService")
    const opLogsService = ServiceLocatorContainer.use("OperationLogsService")
    const pushQueueService = ServiceLocatorContainer.use("PushQueueService")

    if (!destinationUserIds?.length) {
      return
    }

    const senderInfo = {
      organizationId: sourceOptions.organizationId,
      session: { organizationId: sourceOptions.organizationId },
      node: config.get("ws.cluster.endpoint"),
    }

    if (sourceOptions.socket) {
      senderInfo.apiType = sourceOptions.socket?.apiType
      senderInfo.session = sessionService.getSession(sourceOptions.socket) ?? senderInfo.session
      senderInfo.deviceId = sessionService.getDeviceId(sourceOptions.socket, senderInfo.session.userId)
    }

    const offlineUsersIds = []
    let currentNodesUserIds = {}
    let otherNodes = {}

    for (const userId of destinationUserIds) {
      const userConnections = await sessionService.listUserData(sourceOptions.organizationId, userId)
      const isOffline = !Object.keys(userConnections ?? {}).length
      const isInactive = Object.values(userConnections).some((extraParams) => sessionService.isUserInactive(null, extraParams))

      if (isOffline && !payloadOptions.notSaveInOfflineStorage) {
        opLogsService.savePacket(userId, payloadOptions.packet)
      }

      if (isOffline || isInactive) {
        offlineUsersIds.push(userId)
      }

      if (isOffline) {
        continue
      }

      this.reduceUserNodeConnections(senderInfo.node, userId, userConnections, currentNodesUserIds, otherNodes)
    }

    Object.keys(currentNodesUserIds).forEach(async (userId) => {
      const exceptDeviceId = payloadOptions.ignoreSelf ? senderInfo.deviceId : void 0

      await this.deliverToUserOnThisNode(userId, exceptDeviceId, payloadOptions.packet, senderInfo)
    })

    Object.entries(otherNodes).forEach(([nodeEndpoint, userIds]) => {
      Object.keys(userIds).forEach(async (userId) => {
        try {
          const clusterPacket = { userId, packet: payloadOptions.packet, senderInfo }
          await clusterManager.senderClusterDeliverPacket(nodeEndpoint, clusterPacket)
        } catch (error) {
          await sessionService.clearNodeUsersSession(nodeEndpoint)
          logger.error(error, "[deliver to other node]")
        }
      })
    })

    if (payloadOptions.pushQueueMessage && offlineUsersIds.length) {
      payloadOptions.pushQueueMessage.setRecipientIds(offlineUsersIds)
      await pushQueueService.createPush(payloadOptions.pushQueueMessage)
    }
  }

  reduceUserNodeConnections(targetNodeEndpoint, userId, nodeConnections, currentNodesAcc, otherNodesAcc) {
    for (const connectionsParams of Object.values(nodeConnections)) {
      const connectionEndpoint = connectionsParams?.[MAIN_CONSTANTS.SESSION_NODE_KEY]
      if (!connectionEndpoint) {
        continue
      }

      if (connectionEndpoint === targetNodeEndpoint || config.get("app.isStandAloneNode")) {
        currentNodesAcc[userId] = connectionEndpoint
        continue
      }

      if (!otherNodesAcc[connectionEndpoint]) {
        otherNodesAcc[connectionEndpoint] = {}
      }

      otherNodesAcc[connectionEndpoint][userId] = connectionEndpoint
    }
  }

  async deliverClusterMessageToUser(deliverPacket) {
    try {
      const { userId, packet, senderInfo } = deliverPacket
      await this.deliverToUserOnThisNode(userId, void 0, packet, senderInfo)
    } catch (error) {
      logger.error(error, "[deliverClusterMessageToUser]")
    }
  }
}

export default new PacketManager()
