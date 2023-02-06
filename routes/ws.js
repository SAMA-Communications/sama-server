import ConversationParticipant from "../models/conversation_participant.js";
import ConversationsController from "../controllers/conversations.js";
import FilesController from "../controllers/files.js";
import LastActivityiesController from "../controllers/activities.js";
import MessagesController from "../controllers/messages.js";
import OfflineQueue from "../models/offline_queue.js";
import StatusesController from "../controllers/status.js";
import UsersBlockController from "../controllers/users_block.js";
import UsersController from "../controllers/users.js";
import RedisClient from "../lib/redis.js";
import ip from "ip";
import { ACTIVE, getDeviceId, getSessionUserId } from "../store/session.js";
import { ERROR_STATUES } from "../constants/http_constants.js";
import { StringDecoder } from "string_decoder";
import { maybeUpdateAndSendUserActivity } from "../store/activity.js";
import {
  clusterClientsWS,
  clusterNodesWS,
} from "../cluster/cluster_manager.js";
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

async function deliverToUser(currentWS, userId, request) {
  const wsRecipient = ACTIVE.DEVICES[userId];

  if (!wsRecipient) {
    return;
  }

  wsRecipient.forEach((data) => {
    if (data.ws !== currentWS) {
      data.ws.send(JSON.stringify({ message: request }));
    }
  });
}

async function deliverToUserOrUsers(dParams, message, currentWS) {
  if (dParams.cid) {
    const participants = await ConversationParticipant.findAll(
      {
        conversation_id: dParams.cid,
      },
      ["user_id"],
      100
    );

    participants.forEach(async (participants) => {
      const uId = participants.user_id;
      const userDevices = await RedisClient.sMembers(uId);
      if (!userDevices?.length) {
        const request = new OfflineQueue({ user_id: uId, request: message });
        await request.save();
        return;
      }
      if (uId.toString() === getSessionUserId(currentWS)) {
        return;
      }
      const deviceId = getDeviceId(currentWS, getSessionUserId(currentWS));
      userDevices.forEach(async (data) => {
        if (data === JSON.stringify({ [deviceId]: ip.address() })) {
          return;
        }
        const d = JSON.parse(data);
        const nodeIp = d[Object.keys(d)[0]];
        if (nodeIp === ip.address()) {
          await deliverToUser(currentWS, uId, message);
        } else {
          const deliveredUserWs = clusterNodesWS[nodeIp]?.ws;
          deliveredUserWs.send(JSON.stringify({ message }));
        }
      });
    });
  }
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
  processJsonMessage,
  deliverToUser,
  deliverToUserOrUsers,
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
      clusterClientsWS["ws"] = ws;
    },

    close: async (ws, code, message) => {
      console.log("[close]", `WebSokect connect down`);
      const uId = getSessionUserId(ws);
      const arrDevices = ACTIVE.DEVICES[uId];

      if (arrDevices) {
        ACTIVE.DEVICES[uId] = arrDevices.filter((obj) => {
          if (obj.ws === ws) {
            // RedisClient.hDel(uId, obj.deviceId);
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
