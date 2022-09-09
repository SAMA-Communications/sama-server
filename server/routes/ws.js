import { StringDecoder } from "string_decoder";
import { ERROR_STATUES } from "../constants/http_constants.js";
import ACTIVE_SESSIONS from "../models/active_sessions.js";
import UsersController from "../controllers/users.js";
import ConversationController from "../controllers/conversations.js";

const decoder = new StringDecoder("utf8");

export async function processJsonMessage(ws, json) {
  const requestId = json.request.id;
  // console.log("[message]", json);

  if (
    !json.request.user_create &&
    !json.request.user_login &&
    !ACTIVE_SESSIONS[ws]
  ) {
    return {
      response: {
        id: requestId,
        error: ERROR_STATUES.UNAUTHORIZED,
      },
    };
  }

  if (json.request.user_create) {
    return await new UsersController().create(ws, json);
  } else if (json.request.user_login) {
    return await new UsersController().login(ws, json);
  } else if (json.request.user_logout) {
    return await new UsersController().logout(ws, json);
  } else if (json.request.user_delete) {
    return await new UsersController().delete(ws, json);
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
      delete ACTIVE_SESSIONS[ws];
    },

    message: async (ws, message, isBinary) => {
      const json = JSON.parse(decoder.write(Buffer.from(message)));
      const responseData = await processJsonMessage(ws, json);
      ws.send(JSON.stringify(responseData));
    },
  });
}
