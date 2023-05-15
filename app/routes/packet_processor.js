import ConversationParticipant from "../models/conversation_participant.js";
import OpLog from "../models/operations_log.js";
import OperationsLogRepository from "../repositories/operations_log_repository.js";
import PushNotificationsRepository from "../repositories/push_notifications_repository.js";
import PushSubscription from "../models/push_subscription.js";
import SessionRepository from "../repositories/session_repository.js";
import User from "../models/user.js";
import clusterManager from "../cluster/cluster_manager.js";
import ip from "ip";
import { ACTIVE } from "../store/session.js";
import { ACTIVITY } from "../store/activity.js";
import { ERROR_STATUES } from "../validations/constants/errors.js";
import { buildWsEndpoint } from "../utils/build_ws_enpdoint.js";
import { default as LastActivityiesController } from "../controllers/activities.js";
import { getIpFromWsUrl } from "../utils/get_ip_from_ws_url.js";
import { routes } from "./routes.js";

class PacketProcessor {
  constructor() {
    this.pushNotificationsRepository = new PushNotificationsRepository(
      PushSubscription
    );
    this.operationsLogRepository = new OperationsLogRepository(OpLog);
    this.sessionRepository = new SessionRepository(ACTIVE);
    this.jsonRequest = routes;
  }

  isAllowedForOfflineStorage(message) {
    return !!(message.message_edit || message.message_delete);
  }

  async deliverToUserOnThisNode(ws, userId, message) {
    const wsRecipient = ACTIVE.DEVICES[userId];

    if (!wsRecipient) {
      this.isAllowedForOfflineStorage(message) &&
        this.operationsLogRepository.savePacket(userId, message);
      return;
    }

    wsRecipient.forEach((data) => {
      data.ws !== ws && data.ws.send(JSON.stringify({ message }));
    });
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
          (await this.deliverToUserOnThisNode(ws, userId, packet));
      } else {
        const recipientClusterNodeWS =
          clusterManager.clusterNodesWS[getIpFromWsUrl(nodeUrl)];
        if (!recipientClusterNodeWS) {
          try {
            // force create connection with cluster node
            const recClusterNodeWs = await clusterManager.createSocketWithNode(
              getIpFromWsUrl(nodeUrl),
              nodeUrl.split(":")[2]
            );
            recClusterNodeWs.send(JSON.stringify({ userId, message: packet }));
          } catch (err) {
            console.error(
              "[PacketProcessor][deliverToUserDevices] createSocketWithNode error",
              err
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

  async deliverToUserOrUsers(ws, packetsMapOrPacket, cid, usersId) {
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
          ["user_id"],
          100
        )
      ).map((obj) => obj.user_id);

    const offlineUsersByPackets = [];
    for (const uId of participants) {
      const userNodeData = await this.sessionRepository.getUserNodeData(uId);
      const uPacket = packetsMapOrPacket[uId] || packetsMapOrPacket;
      if (!userNodeData?.length) {
        this.isAllowedForOfflineStorage(uPacket) &&
          this.operationsLogRepository.savePacket(uId, uPacket);

        !uPacket.message_reed && offlineUsersByPackets.push(uId);
        continue;
      }
      this.#deliverToUserDevices(ws, userNodeData, uId, uPacket);
    }

    if (offlineUsersByPackets.length) {
      const pushMessage = packetsMapOrPacket.message;
      pushMessage && delete packetsMapOrPacket.message;
      this.pushNotificationsRepository.sendPushNotification(
        offlineUsersByPackets,
        packetsMapOrPacket,
        pushMessage
      );
    }
  }

  async #processJsonMessage(ws, json) {
    if (
      !ACTIVE.SESSIONS.get(ws) &&
      !json.request?.user_create &&
      !json.request?.user_login
    ) {
      throw new Error(ERROR_STATUES.UNAUTHORIZED.message, {
        cause: ERROR_STATUES.UNAUTHORIZED,
      });
    }

    let reqFirstParams = Object.keys(json)[0];
    let reqData = null;

    if (reqFirstParams === "request") {
      reqData = json.request;
      reqFirstParams = Object.keys(reqData)[0];
    } else {
      reqData = json;
    }

    return this.jsonRequest[reqFirstParams](ws, reqData);
  }

  async processJsonMessageOrError(ws, json) {
    let responseData;
    try {
      responseData = await this.#processJsonMessage(ws, json);
    } catch (e) {
      if (json.request) {
        responseData = {
          response: {
            id: json.request.id,
            error: e.cause,
          },
        };
      } else {
        const topLevelElement = Object.keys(json)[0];
        responseData = {
          [topLevelElement]: {
            id: json[topLevelElement].id,
            error: e.cause,
          },
        };
      }
    }

    return responseData;
  }

  async deliverClusterMessageToUser(userId, message) {
    try {
      await this.deliverToUserOnThisNode(null, userId, message);
    } catch (err) {
      console.error(
        "[cluster_manager][deliverClusterMessageToUser] error",
        err
      );
      this.isAllowedForOfflineStorage(message) &&
        this.perationsLogRepository.savePacket(userId, message);
    }
  }

  async maybeUpdateAndSendUserActivity(ws, { uId, rId }, status) {
    if (!ACTIVITY.SUBSCRIBERS[uId]) {
      return;
    }

    const currentTime = Math.round(new Date() / 1000);
    if (status !== "online") {
      await User.updateOne(
        { _id: uId },
        { $set: { recent_activity: currentTime } }
      );
      await LastActivityiesController.statusUnsubscribe(ws, {
        request: { id: rId || "Unsubscribe" },
      });
    }

    const message = { last_activity: { [uId]: status || currentTime } };
    const arrSubscribers = Object.keys(ACTIVITY.SUBSCRIBERS[uId]);

    arrSubscribers.forEach((uId) =>
      this.deliverToUserOnThisNode(ws, uId, message)
    );
  }
}

export default new PacketProcessor();
