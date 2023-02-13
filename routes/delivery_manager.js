import ConversationParticipant from "../models/conversation_participant.js";
import FilesController from "../controllers/files.js";
import LastActivityiesController from "../controllers/activities.js";
import MessagesController from "../controllers/messages.js";
import StatusesController from "../controllers/status.js";
import UsersBlockController from "../controllers/users_block.js";
import UsersController from "../controllers/users.js";
import ip from "ip";
import { ACTIVE } from "../store/session.js";
import ConversationsController from "../controllers/conversations.js";
import { ERROR_STATUES } from "../constants/http_constants.js";
import { ObjectId } from "mongodb";
import { buildWsEndpoint } from "../utils/build_ws_enpdoint.js";
import { clusterNodesWS } from "../cluster/cluster_manager.js";
import { default as SessionRepository } from "../repositories/session_repository.js";
import { getIpFromWsUrl } from "../utils/get_ip_from_ws_url.js";
import { saveRequestInOfflineQueue } from "../store/offline_queue.js";

class PacketProcessor {
  constructor() {
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

  #deliverToUserDevices(
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

      this.#deliverToUserDevices(ws, userNodeConnections, uId, message);
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

      this.#deliverToUserDevices(ws, userNodeConnections, uId, message, true);
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

  // deliverActivityStatusToSubscribers??
  //  maybeUpdateAndSendUserActivity??
}

export default new PacketProcessor();
