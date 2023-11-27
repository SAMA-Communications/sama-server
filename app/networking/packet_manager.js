import ip from 'ip';

import activityManager from './activity_manager.js'
import ConversationParticipant from '../models/conversation_participant.js'
import OpLog from '../models/operations_log.js'
import OperationsLogRepository from '../repositories/operations_log_repository.js'
import PushNotificationsRepository from '../repositories/push_notifications_repository.js'
import PushSubscription from '../models/push_subscription.js'
import SessionRepository from '../repositories/session_repository.js'
import clusterManager from '../cluster/cluster_manager.js'
import { ACTIVE } from '../store/session.js'
import { buildWsEndpoint } from '../utils/build_ws_enpdoint.js'
import { getIpFromWsUrl } from '../utils/get_ip_from_ws_url.js'

class PacketManager {
  constructor() {
    this.pushNotificationsRepository = new PushNotificationsRepository(
      PushSubscription
    );
    this.operationsLogRepository = new OperationsLogRepository(OpLog);
    this.sessionRepository = new SessionRepository(ACTIVE);
  }

  isAllowedForOfflineStorage(packet) {
    return !!(packet.message_edit || packet.message_delete);
  }

  async deliverToUserOnThisNode(ws, userId, packet, deviceId) {
    const activeDevices = ACTIVE.DEVICES[userId];

    if (!activeDevices) {
      this.isAllowedForOfflineStorage(packet) &&
        this.operationsLogRepository.savePacket(userId, packet);
      return;
    }

    const wsRecipient = deviceId
      ? [activeDevices.find((obj) => obj.deviceId === deviceId)]
      : activeDevices;

    try {
      wsRecipient.forEach(
        (r) => r.ws !== ws && r.ws.send(packet)
      );
    } catch (err) {
      console.error(`[PacketProcessor] send on socket error`, err);
    }
  }

  #deliverToUserDevices(ws, nodeConnections, userId, packet) {
    nodeConnections.forEach(async (data) => {
      const nodeInfo = JSON.parse(data);
      const nodeUrl = nodeInfo[Object.keys(nodeInfo)[0]];
      const nodeDeviceId = Object.keys(nodeInfo)[0];
      const currentDeviceId = this.sessionRepository.getDeviceId(ws, userId);

      this.curentNodeUrl = buildWsEndpoint(
        ip.address(),
        clusterManager.clusterPort
      );
      if (nodeUrl === this.curentNodeUrl) {
        nodeDeviceId !== currentDeviceId &&
          (await this.deliverToUserOnThisNode(
            ws,
            userId,
            packet,
            nodeDeviceId
          ));
      } else {
        const recipientClusterNodeWS =
          clusterManager.clusterNodesWS[getIpFromWsUrl(nodeUrl)];
        if (!recipientClusterNodeWS) {
          try {
            // force create connection with cluster node
            const recClusterNodeWs = await clusterManager.createSocketWithNode(
              getIpFromWsUrl(nodeUrl),
              nodeUrl.split(':')[2]
            );
            recClusterNodeWs.send(JSON.stringify({ userId, message: packet }));
          } catch (err) {
            console.error(
              '[PacketProcessor][deliverToUserDevices] createSocketWithNode error',
              err.slice(39)
            );

            await this.sessionRepository.clearNodeUsersSession(nodeUrl);
            this.isAllowedForOfflineStorage(packet) &&
              this.operationsLogRepository.savePacket(userId, packet);
          }
          return;
        }

        try {
          recipientClusterNodeWS.send(
            JSON.stringify({ userId, message: packet })
          );
        } catch (err) {
          await this.sessionRepository.clearNodeUsersSession(nodeUrl);
          this.isAllowedForOfflineStorage(packet) &&
            this.operationsLogRepository.savePacket(userId, packet);
        }
      }
    });
  }

  async deliverToUserOrUsers(ws, packet, cid, usersId) {
    if (!cid && !usersId) {
      return;
    }

    const participants =
      usersId ||
      (
        await ConversationParticipant.findAll(
          {
            conversation_id: cid,
          },
          ['user_id'],
          100
        )
      ).map((obj) => obj.user_id);

    const offlineUsersByPackets = [];
    const pushMessage = packet.push_message;
    pushMessage && delete packet.push_message;

    for (const uId of participants) {
      const userNodeData = await this.sessionRepository.getUserNodeData(uId);

      if (!userNodeData?.length) {
        this.isAllowedForOfflineStorage(packet) &&
          this.operationsLogRepository.savePacket(uId, packet);

        !packet.message_read && offlineUsersByPackets.push(uId);
        continue;
      }
      this.#deliverToUserDevices(ws, userNodeData, uId, packet);
    }

    if (offlineUsersByPackets.length) {
      this.pushNotificationsRepository.sendPushNotification(
        offlineUsersByPackets,
        pushMessage
      );
    }
  }

  async deliverClusterMessageToUser(userId, packet) {
    try {
      await this.deliverToUserOnThisNode(null, userId, packet);
    } catch (err) {
      console.error(
        '[cluster_manager][deliverClusterMessageToUser] error',
        err
      );
      this.isAllowedForOfflineStorage(packet) &&
        this.operationsLogRepository.savePacket(userId, packet);
    }
  }

  async maybeUpdateAndSendUserActivity(ws, ids, status) {
    const deliver = await activityManager.maybeUpdateAndSendUserActivity(ws, ids, status)
    if (!deliver) {
      return
    }

    for (const uId of deliver.subscriptions) {
      await this.deliverToUserOnThisNode(ws, uId, deliver.message)
    }
  }
}

export default new PacketManager();
