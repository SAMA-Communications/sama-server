import ConversationParticipant from "../models/conversation_participant.js";
import ConversationsController from "../controllers/conversations.js";
import FilesController from "../controllers/files.js";
import LastActivityiesController from "../controllers/activities.js";
import MessagesController from "../controllers/messages.js";
import SessionController from "../repositories/session_repository.js";
import StatusesController from "../controllers/status.js";
import UsersBlockController from "../controllers/users_block.js";
import UsersController from "../controllers/users.js";
import ip from "ip";
import { ACTIVE } from "../store/session.js";
import { ERROR_STATUES } from "../constants/http_constants.js";
import { StringDecoder } from "string_decoder";
import { buildWsEndpoint } from "../utils/build_ws_enpdoint.js";
import { clusterNodesWS } from "../cluster/cluster_manager.js";
import { getIpFromWsUrl } from "../utils/get_ip_from_ws_url.js";
import { maybeUpdateAndSendUserActivity } from "../store/activity.js";
import { saveRequestInOfflineQueue } from "../store/offline_queue.js";
const decoder = new StringDecoder("utf8");

const jsonRequest = {
  message: (ws, json) => new MessagesController().create(ws, json),
  typing: (ws, json) => new StatusesController().typing(ws, json),
  request: {
    message_edit: (ws, json) => new MessagesController().edit(ws, json),
    message_list: (ws, json) => new MessagesController().list(ws, json),
    message_read: (ws, json) => new MessagesController().read(ws, json),
    message_delete: (ws, json) => new MessagesController().delete(ws, json),
    create_files: (ws, json) => new FilesController().createUrl(ws, json),
    get_file_urls: (ws, json) => new FilesController().getDownloadUrl(ws, json),
    block_user: (ws, json) => new UsersBlockController().block(ws, json),
    unblock_user: (ws, json) => new UsersBlockController().unblock(ws, json),
    list_blocked_users: (ws, json) => new UsersBlockController().list(ws, json),
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

async function deliverToUserOnThisNode(userId, message, currentWS) {
  const wsRecipient = ACTIVE.DEVICES[userId];

  if (!wsRecipient) {
    saveRequestInOfflineQueue(userId, message);
    return;
  }

  wsRecipient.forEach((data) => {
    data.ws !== currentWS && data.ws.send(JSON.stringify({ message }));
  });
}

async function deliverToUserOrUsers(dParams, message, currentWS) {
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
    if (uId.toString() === SessionController.getSessionUserId(currentWS)) {
      return;
    }

    const userDevices = await SessionController.getUserNodeConnections(uId);
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

async function processJsonMessage(ws, json) {
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
  return await (reqFirstParams === "request"
    ? jsonRequest.request[Object.keys(json.request)[0]](ws, json)
    : jsonRequest[reqFirstParams](ws, json));
}

async function processJsonMessageOrError(ws, json) {
  let responseData;
  try {
    responseData = await processJsonMessage(ws, json);
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

export {
  deliverToUserOnThisNode,
  deliverToUserOrUsers,
  processJsonMessage,
  processJsonMessageOrError,
};

export default function routes(app, wsOptions) {
  app.ws("/*", {
    ...wsOptions,

    open: (ws) => {
      console.log(
        "[open]",
        `IP: ${Buffer.from(ws.getRemoteAddressAsText()).toString()}`
      );
    },

    close: async (ws, code, message) => {
      console.log("[close]", `WebSokect connect down`);
      const uId = SessionController.getSessionUserId(ws);
      const arrDevices = ACTIVE.DEVICES[uId];

      if (arrDevices) {
        ACTIVE.DEVICES[uId] = arrDevices.filter((obj) => {
          if (obj.ws === ws) {
            SessionController.removeUserNodeData(
              uId,
              obj.deviceId,
              ip.address(),
              process.env.CLUSTER_COMMUNICATION_PORT
            );
            return false;
          }
          return true;
        });
        await maybeUpdateAndSendUserActivity(ws, { uId });
      }
      ACTIVE.SESSIONS.delete(ws);
    },

    message: async (ws, message, isBinary) => {
      const json = JSON.parse(decoder.write(Buffer.from(message)));

      const responseData = await processJsonMessageOrError(ws, json);
      ws.send(JSON.stringify(responseData));
    },
  });
}
