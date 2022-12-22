import ConversationParticipant from "../models/conversation_participant.js";
import FileController from "../controllers/files.js";
import LastActivityController from "../controllers/activities.js";
import MessagesController from "../controllers/messages.js";
import OfflineQueue from "../models/offline_queue.js";
import StatusController from "../controllers/status.js";
import UsersController from "../controllers/users.js";
import { ACTIVE, getSessionUserId } from "../store/session.js";
import { ERROR_STATUES } from "../constants/http_constants.js";
import { StringDecoder } from "string_decoder";
import { maybeUpdateAndSendUserActivity } from "../store/activity.js";
import ConversationController from "../controllers/conversations.js";
const decoder = new StringDecoder("utf8");

const jsonRequest = {
  message: new MessagesController().create,
  typing: new StatusController().typing,
  request: {
    message_edit: new MessagesController().edit,
    message_list: new MessagesController().list,
    message_read: new MessagesController().read,
    message_delete: new MessagesController().delete,
    create_file: new FileController().createUrl,
    get_file_urls: new FileController().getDownloadUrl,
    user_create: new UsersController().create,
    user_edit: new UsersController().edit,
    user_login: new UsersController().login,
    user_logout: new UsersController().logout,
    user_delete: new UsersController().delete,
    user_search: new UsersController().search,
    user_last_activity_subscribe: new LastActivityController().statusSubscribe,
    user_last_activity_unsubscribe: new LastActivityController()
      .statusUnsubscribe,
    user_last_activity: new LastActivityController().getUserStatus,
    getParticipantsByCids: new ConversationController().getParticipantsByCids,
    conversation_create: new ConversationController().create,
    conversation_delete: new ConversationController().delete,
    conversation_update: new ConversationController().update,
    conversation_list: new ConversationController().list,
  },
};

async function deliverToUser(currentWS, userId, request) {
  const wsRecipient = ACTIVE.DEVICES[userId];

  if (wsRecipient) {
    wsRecipient.forEach((data) => {
      if (data.ws !== currentWS) {
        data.ws.send(JSON.stringify({ message: request }));
      }
    });
  } else {
    request = new OfflineQueue({ user_id: userId, request: request });
    await request.save();
  }
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
      await deliverToUser(currentWS, participants.user_id, message);
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
    console.log(e);
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
    },

    close: async (ws, code, message) => {
      console.log("[close]", `WebSokect connect down`);
      const uId = getSessionUserId(ws);
      const arrDevices = ACTIVE.DEVICES[uId];

      if (arrDevices) {
        ACTIVE.DEVICES[uId] = arrDevices.filter((obj) => obj.ws !== ws);
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
