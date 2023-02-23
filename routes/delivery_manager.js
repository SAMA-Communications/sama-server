import ConversationParticipant from "../models/conversation_participant.js";
import ConversationsController from "../controllers/conversations.js";
import FilesController from "../controllers/files.js";
import LastActivityiesController from "../controllers/activities.js";
import SessionRepository from "../repositories/session_repository.js";
import MessagesController from "../controllers/messages.js";
import OpLog from "../models/operations_log.js";
import OperationsLogController from "../controllers/operations_log.js";
import OperationsLogRepository from "../repositories/operations_log_repository.js";
import StatusesController from "../controllers/status.js";
import User from "../models/user.js";
import UsersBlockController from "../controllers/users_block.js";
import UsersController from "../controllers/users.js";
import ip from "ip";
import { ACTIVE } from "../store/session.js";
import { ACTIVITY } from "../store/activity.js";
import { ERROR_STATUES } from "../constants/http_constants.js";
import { buildWsEndpoint } from "../utils/build_ws_enpdoint.js";
import { clusterNodesWS } from "../cluster/cluster_manager.js";
import { getIpFromWsUrl } from "../utils/get_ip_from_ws_url.js";
import { getClusterPort } from "../cluster/cluster_manager.js";

class PacketProcessor {
  constructor() {
    // this.curentNodeUrl = buildWsEndpoint(
    //   ip.address(),
    //   process.env.CLUSTER_COMMUNICATION_PORT
    // );
    this.operationsLogRepository = new OperationsLogRepository(OpLog);
    this.sessionRepository = new SessionRepository(ACTIVE);
    this.jsonRequest = {
      message: (ws, json) => new MessagesController().create(ws, json),
      typing: (ws, json) => new StatusesController().typing(ws, json),
      request: {
        message_edit: (ws, json) => new MessagesController().edit(ws, json),
        message_list: (ws, json) => new MessagesController().list(ws, json),
        message_read: (ws, json) => new MessagesController().read(ws, json),
        message_delete: (ws, json) => new MessagesController().delete(ws, json),
        create_files: (ws, json) => new FilesController().createUrl(ws, json),
        get_file_urls: (ws, json) =>
          new FilesController().getDownloadUrl(ws, json),
        block_user: (ws, json) => new UsersBlockController().block(ws, json),
        unblock_user: (ws, json) =>
          new UsersBlockController().unblock(ws, json),
        list_blocked_users: (ws, json) =>
          new UsersBlockController().list(ws, json),
        user_create: (ws, json) => new UsersController().create(ws, json),
        user_edit: (ws, json) => new UsersController().edit(ws, json),
        user_login: (ws, json) => new UsersController().login(ws, json),
        user_logout: (ws, json) => new UsersController().logout(ws, json),
        user_delete: (ws, json) => new UsersController().delete(ws, json),
        user_search: (ws, json) => new UsersController().search(ws, json),
        op_log_list: (ws, json) => new OperationsLogController().logs(ws, json),
        user_last_activity_subscribe: (ws, json) =>
          new LastActivityiesController().statusSubscribe(ws, json),
        user_last_activity_unsubscribe: (ws, json) =>
          new LastActivityiesController().statusUnsubscribe(ws, json),
        user_last_activity: (ws, json) =>
          new LastActivityiesController().getUserStatus(ws, json),
        getParticipantsByCids: (ws, json) =>
          new ConversationsController().getParticipantsByCids(ws, json),
        conversation_create: (ws, json) =>
          new ConversationsController().create(ws, json),
        conversation_delete: (ws, json) =>
          new ConversationsController().delete(ws, json),
        conversation_update: (ws, json) =>
          new ConversationsController().update(ws, json),
        conversation_list: (ws, json) =>
          new ConversationsController().list(ws, json),
      },
    };
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

      this.curentNodeUrl = buildWsEndpoint(
        ip.address(),
        getClusterPort()
      );

      if (nodeUrl === this.curentNodeUrl) {
        await this.deliverToUserOnThisNode(ws, userId, packet);
      } else {
        const recipientClusterNodeWS = clusterNodesWS[getIpFromWsUrl(nodeUrl)];
        if (!recipientClusterNodeWS) {
          this.isAllowedForOfflineStorage(packet) &&
            this.operationsLogRepository.savePacket(userId, packet);
          return;
        }

        try {
          recipientClusterNodeWS.send(
            JSON.stringify({ userId, message: packet })
          );
        } catch (err) {
          console.log(err);
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

    participants.forEach(async (uId) => {
      if (uId.toString() === this.sessionRepository.getSessionUserId(ws)) {
        return;
      }

      const userNodeData = await this.sessionRepository.getUserNodeData(uId);
      if (!userNodeData?.length) {
        this.isAllowedForOfflineStorage(
          packetsMapOrPacket[uId] || packetsMapOrPacket
        ) &&
          this.perationsLogRepository.savePacket(
            uId,
            packetsMapOrPacket[uId] || packetsMapOrPacket
          );
        return;
      }

      this.#deliverToUserDevices(
        ws,
        userNodeData,
        uId,
        packetsMapOrPacket[uId] || packetsMapOrPacket
      );
    });
  }

  #processJsonMessage(ws, json) {
    if (
      !ACTIVE.SESSIONS.get(ws) &&
      !json.request?.user_create &&
      !json.request?.user_login
    ) {
      throw new Error(ERROR_STATUES.UNAUTHORIZED.message, {
        cause: ERROR_STATUES.UNAUTHORIZED,
      });
    }

    const reqFirstParams = Object.keys(json)[0];
    return reqFirstParams === "request"
      ? this.jsonRequest.request[Object.keys(json.request)[0]](ws, json)
      : this.jsonRequest[reqFirstParams](ws, json);
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
      this.isAllowedForOfflineStorage(request) &&
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
      await new LastActivityiesController().statusUnsubscribe(ws, {
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
