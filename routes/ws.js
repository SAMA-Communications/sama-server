import ConversationParticipant from "../models/conversation_participant.js";
import OfflineQueue from "../models/offline_queue.js";
import { ACTIVE, getSessionUserId } from "../store/session.js";
import { ERROR_STATUES } from "../constants/http_constants.js";
import { StringDecoder } from "string_decoder";
import { maybeUpdateAndSendUserActivity } from "../store/activity.js";
import { jsonKeys, jsonRequest } from "../constants/json_requests.js";
const decoder = new StringDecoder("utf8");

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
  return await (reqFirstParams !== "request"
    ? jsonKeys[reqFirstParams](ws, json)
    : jsonRequest[Object.keys(json.request)[0]](ws, json));
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
