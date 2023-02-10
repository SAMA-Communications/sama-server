import ConversationParticipant from "../models/conversation_participant.js";
import { ACTIVE } from "../store/session.js";
import { buildWsEndpoint } from "../utils/build_ws_enpdoint.js";
import { clusterNodesWS } from "../cluster/cluster_manager.js";
import { default as SessionRepository } from "../repositories/session_repository.js";
import { getIpFromWsUrl } from "../utils/get_ip_from_ws_url.js";
import { saveRequestInOfflineQueue } from "../store/offline_queue.js";

class DeliveryManager {
  constructor() {}

  async deliverToUserOnThisNode(userId, message, currentWS) {
    const wsRecipient = ACTIVE.DEVICES[userId];

    if (!wsRecipient) {
      //if req from deliverStatus => don`t save at queue
      saveRequestInOfflineQueue(userId, message);
      return;
    }

    wsRecipient.forEach((data) => {
      data.ws !== currentWS && data.ws.send(JSON.stringify({ message }));
    });
  }

  async deliverToUserOrUsers(dParams, message, currentWS) {
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
      if (uId.toString() === SessionRepository.getSessionUserId(currentWS)) {
        return;
      }

      const userDevices = await SessionRepository.getUserNodeConnections(uId);
      if (!userDevices?.length) {
        saveRequestInOfflineQueue(uId, message);
        return;
      }

      userDevices.forEach(async (data) => {
        const nodeInfo = JSON.parse(data);
        const nodeUrl = nodeInfo[Object.keys(nodeInfo)[0]];
        const curentNodeUrl = buildWsEndpoint(
          ip.address(),
          process.env.CLUSTER_COMMUNICATION_PORT
        );
        if (nodeUrl === curentNodeUrl) {
          // reanme to tihs
          await deliverToUserOnThisNode(uId, message, currentWS);
        } else {
          const recipientWS = clusterNodesWS[getIpFromWsUrl(nodeUrl)];
          if (!recipientWS) {
            saveRequestInOfflineQueue(uId, message);
            return;
          }

          try {
            recipientWS.send(JSON.stringify({ userId: uId, message }));
          } catch (err) {
            console.log(err);
            saveRequestInOfflineQueue(uId, message);
          }
        }
      });
    });
  }

  // in message.js
  async deliverStatusToUsers(midsByUId, cid, currentWS) {
    const participantsIds = Object.keys(midsByUId);
    participantsIds.forEach(async (uId) => {
      const userDevices = await SessionRepository.getUserNodeConnections(uId);
      if (!userDevices?.length) {
        return;
      }

      const message = {
        message_read: {
          cid: ObjectId(cid),
          ids: midsByUId[uId].map((el) => el._id),
          from: ObjectId(uId),
        },
      };

      userDevices.forEach(async (data) => {
        const nodeInfo = JSON.parse(data);
        const nodeUrl = nodeInfo[Object.keys(nodeInfo)[0]];
        const curentNodeUrl = buildWsEndpoint(
          ip.address(),
          process.env.CLUSTER_COMMUNICATION_PORT
        );

        if (nodeUrl === curentNodeUrl) {
          await deliverToUserOnThisNode(uId, message, currentWS);
        } else {
          const recipientWS = clusterNodesWS[getIpFromWsUrl(nodeUrl)];
          if (!recipientWS) {
            return;
          }

          try {
            recipientWS.send(JSON.stringify({ userId: uId, message }));
          } catch (err) {
            console.log(err);
          }
        }
      });
    });
  }

  // deliverActivityStatusToSubscribers??
  //  maybeUpdateAndSendUserActivity??
}

export default new DeliveryManager();
