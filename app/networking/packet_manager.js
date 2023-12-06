import ip from 'ip'

import OpLog from '../models/operations_log.js'
import OperationsLogRepository from '../repositories/operations_log_repository.js'
import PushNotificationsRepository from '../repositories/push_notifications_repository.js'
import PushSubscription from '../models/push_subscription.js'
import SessionRepository from '../repositories/session_repository.js'
import clusterManager from '../cluster/cluster_manager.js'
import { ACTIVE } from '../store/session.js'
import { buildWsEndpoint } from '../utils/build_ws_endpoint.js'
import { getIpFromWsUrl } from '../utils/get_ip_from_ws_url.js'

class PacketManager {
  constructor() {
    this.pushNotificationsRepository = new PushNotificationsRepository(
      PushSubscription
    )
    this.operationsLogRepository = new OperationsLogRepository(OpLog)
    this.sessionRepository = new SessionRepository(ACTIVE)
  }

  async deliverToUserOnThisNode(ws, userId, packet, deviceId, notSaveInOfflineStorage) {
    const activeDevices = ACTIVE.DEVICES[userId] 

    if (!activeDevices && !notSaveInOfflineStorage) {
      this.operationsLogRepository.savePacket(userId, packet)
      return
    }

    const wsRecipient = deviceId
      ? [activeDevices.find((obj) => obj.deviceId === deviceId)]
      : activeDevices

    try {
      wsRecipient.forEach(
        (r) => r.ws !== ws && r.ws.send(packet)
      )
    } catch (err) {
      console.error(`[PacketProcessor] send on socket error`, err)
    }
  }

  #deliverToUserDevices(ws, nodeConnections, userId, packet, notSaveInOfflineStorage) {
    nodeConnections.forEach(async (data) => {
      const nodeInfo = JSON.parse(data)
      const nodeUrl = nodeInfo[Object.keys(nodeInfo)[0]]
      const nodeDeviceId = Object.keys(nodeInfo)[0]
      const currentDeviceId = this.sessionRepository.getDeviceId(ws, userId)

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

            await this.sessionRepository.clearNodeUsersSession(nodeUrl)
            if (!notSaveInOfflineStorage) {
              this.operationsLogRepository.savePacket(userId, packet)
            }
          }
          return
        }

        try {
          recipientClusterNodeWS.send(
            JSON.stringify({ userId, message: packet })
          )
        } catch (err) {
          await this.sessionRepository.clearNodeUsersSession(nodeUrl)
          if (!notSaveInOfflineStorage) {
            this.operationsLogRepository.savePacket(userId, packet)
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
    const pushMessage = packet.push_message
    pushMessage && delete packet.push_message

    for (const uId of usersIds) {
      const userNodeData = await this.sessionRepository.getUserNodeData(uId)

      if (!userNodeData?.length) {
        if (!notSaveInOfflineStorage) {
          this.operationsLogRepository.savePacket(uId, packet)
        }
        !packet.message_read && offlineUsersByPackets.push(uId)
        continue
      }
      this.#deliverToUserDevices(ws, userNodeData, uId, packet, notSaveInOfflineStorage)
    }

    if (offlineUsersByPackets.length) {
      this.pushNotificationsRepository.sendPushNotification(
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
        this.operationsLogRepository.savePacket(userId, packet)
      }
    }
  }
}

export default new PacketManager()
