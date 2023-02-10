import ConversationParticipant from "../models/conversation_participant.js";
import ip from "ip";
import { ACTIVE } from "../store/session.js";
import { ObjectId } from "mongodb";
import { buildWsEndpoint } from "../utils/build_ws_enpdoint.js";
import { clusterNodesWS } from "../cluster/cluster_manager.js";
import { default as SessionRepository } from "../repositories/session_repository.js";
import { getIpFromWsUrl } from "../utils/get_ip_from_ws_url.js";
import { saveRequestInOfflineQueue } from "../store/offline_queue.js";

class DeliveryManager {
  constructor() {}

  async deliverToUserOnThisNode(
    ws,
    userId,
    message,
    isNoStoreReqInOfflineQueue
  ) {
    const wsRecipient = ACTIVE.DEVICES[userId];

    if (!wsRecipient) {
      !isNoStoreReqInOfflineQueue && saveRequestInOfflineQueue(userId, message);
      return;
    }

    wsRecipient.forEach((data) => {
      data.ws !== ws && data.ws.send(JSON.stringify({ message }));
    });
  }

  async deliverToUserDevices(
    ws,
    nodeConnections,
    userId,
    message,
    isNoStoreReqInOfflineQueue
  ) {
    nodeConnections.forEach(async (data) => {
      const nodeInfo = JSON.parse(data);
      const nodeUrl = nodeInfo[Object.keys(nodeInfo)[0]];
      const curentNodeUrl = buildWsEndpoint(
        ip.address(),
        process.env.CLUSTER_COMMUNICATION_PORT
      );

      if (nodeUrl === curentNodeUrl) {
        await this.deliverToUserOnThisNode(
          userId,
          message,
          ws,
          isNoStoreReqInOfflineQueue
        );
      } else {
        const recipientWS = clusterNodesWS[getIpFromWsUrl(nodeUrl)];
        if (!recipientWS) {
          !isNoStoreReqInOfflineQueue &&
            saveRequestInOfflineQueue(userId, message);
          return;
        }

        try {
          recipientWS.send(JSON.stringify({ userId, message }));
        } catch (err) {
          console.log(err);
          !isNoStoreReqInOfflineQueue &&
            saveRequestInOfflineQueue(userId, message);
        }
      }
    });
  }

  async deliverToUserOrUsers(ws, dParams, message) {
    if (!dParams.cid) {
      return;
    }

    const participants = await ConversationParticipant.findAll(
      {
        conversation_id: dParams.cid,
      },
      ["user_id"],
      100
    );

    participants.forEach(async (participants) => {
      const uId = participants.user_id;
      if (uId.toString() === SessionRepository.getSessionUserId(ws)) {
        return;
      }

      const userNodeConnections =
        await SessionRepository.getUserNodeConnections(uId);
      if (!userNodeConnections?.length) {
        saveRequestInOfflineQueue(uId, message);
        return;
      }

      await this.deliverToUserDevices(ws, userNodeConnections, uId, message);
    });
  }

  async deliverStatusToUsers(ws, cid, midsByUId) {
    const participantsIds = Object.keys(midsByUId);
    participantsIds.forEach(async (uId) => {
      const userNodeConnections =
        await SessionRepository.getUserNodeConnections(uId);
      if (!userNodeConnections?.length) {
        return;
      }

      const message = {
        message_read: {
          cid: ObjectId(cid),
          ids: midsByUId[uId].map((el) => el._id),
          from: ObjectId(uId),
        },
      };

      await this.deliverToUserDevices(
        ws,
        userNodeConnections,
        uId,
        message,
        true
      );
    });
  }

  // deliverActivityStatusToSubscribers??
  //  maybeUpdateAndSendUserActivity??
}

export default new DeliveryManager();
