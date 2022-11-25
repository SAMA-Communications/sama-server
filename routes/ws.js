import ConversationController from "../controllers/conversations.js";
import ConversationParticipant from "../models/conversation_participant.js";
import MessagesController from "../controllers/messages.js";
import OfflineQueue from "../models/offline_queue.js";
import StatusController from "../controllers/status.js";
import UsersController from "../controllers/users.js";
import { ACTIVE, getSessionUserId, getDeviceId } from "../models/active.js";
import { ERROR_STATUES } from "../constants/http_constants.js";
import { StringDecoder } from "string_decoder";

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
    !json.request?.user_create &&
    !json.request?.user_login &&
    !ACTIVE.SESSIONS.get(ws)
  ) {
    throw new Error(ERROR_STATUES.UNAUTHORIZED.message, {
      cause: ERROR_STATUES.UNAUTHORIZED,
    });
  }

  if (json.message) {
    return await new MessagesController().create(ws, json);
  } else if (json.typing) {
    return await new StatusController().typing(ws, json);
  } else if (json.read) {
    return await new StatusController().read(ws, json);
  } else if (json.delivered) {
    return await new StatusController().delivered(ws, json);
  } else if (json.request.message_edit) {
    return await new MessagesController().edit(ws, json);
  } else if (json.request.message_list) {
    return await new MessagesController().list(ws, json);
  } else if (json.request.message_read) {
    return await new MessagesController().read(ws, json);
  } else if (json.request.message_delete) {
    return await new MessagesController().delete(ws, json);
  } else if (json.request.user_create) {
    return await new UsersController().create(ws, json);
  } else if (json.request.user_login) {
    return await new UsersController().login(ws, json);
  } else if (json.request.user_logout) {
    return await new UsersController().logout(ws, json);
  } else if (json.request.user_delete) {
    return await new UsersController().delete(ws, json);
  } else if (json.request.user_search) {
    return await new UsersController().search(ws, json);
  } else if (json.request.getParticipantsByCids) {
    return await new ConversationController().getParticipantsByCids(ws, json);
  } else if (json.request.conversation_create) {
    return await new ConversationController().create(ws, json);
  } else if (json.request.conversation_delete) {
    return await new ConversationController().delete(ws, json);
  } else if (json.request.conversation_update) {
    return await new ConversationController().update(ws, json);
  } else if (json.request.conversation_list) {
    return await new ConversationController().list(ws, json);
  }
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

    close: (ws, code, message) => {
      console.log("[close]", `WebSokect connect down`);
      const arrDevices = ACTIVE.DEVICES[getSessionUserId(ws)];
      if (arrDevices) {
        ACTIVE.DEVICES[getSessionUserId(ws)] = arrDevices.filter(
          (obj) => obj.ws !== ws
        );
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
