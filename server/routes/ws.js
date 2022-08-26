import User from "../models/user.js";
import UserSession from "../models/user_session.js";
import { slice } from "../utils/req_res_utils.js";

import { StringDecoder } from "string_decoder";
const decoder = new StringDecoder("utf8");

const ACTIVE_SESSIONS = {};

export default function routes(app, wsOptions) {
  function sendErrorResponse(ws, requestId, errorStatus, errorMessage) {
    ws.send(
      JSON.stringify({
        response: {
          id: requestId,
          error: { status: errorStatus, message: errorMessage },
        },
      })
    );
  }

  async function userLogoutById(ws, requestId, userSession) {
    if (userSession) {
      await userSession.delete();
      ws.send(JSON.stringify({ response: { id: requestId, success: true } }));
    } else {
      sendErrorResponse(ws, requestId, 404, "Unauthorized");
    }
  }
  app.ws("/*", {
    ...wsOptions,

    open: (ws) => {
      console.log(
        "[open]",
        `IP: ${Buffer.from(ws.getRemoteAddressAsText()).toString()}`
      );
      // ws.send(JSON.stringify("Connected"));
    },

    close: (ws, code, message) => {
      delete ACTIVE_SESSIONS[ws];
    },

    message: async (ws, message, isBinary) => {
      const json = JSON.parse(decoder.write(Buffer.from(message)));
      const requestId = json.request.id;
      console.log("[message]", json);

      if (json.request.user_create) {
        //Create
        const allowedFields = ["login", "password"];
        const userParams = slice(json.request.user_create, allowedFields);

        const isUserCreate = await User.findOne({ login: userParams.login });
        if (!isUserCreate) {
          console.log("Create...");
          const user = new User(userParams);
          await user.save();
          ws.send(
            JSON.stringify({ response: { id: requestId, user: user.toJSON() } })
          );
        } else {
          sendErrorResponse(ws, requestId, 405, "User is created");
        }
      } else if (json.request.user_login) {
        //Login
        console.log("Login...");

        const userInfo = json.request.user_login;
        const user = await User.findOne({ login: userInfo.login });
        if (!user) {
          sendErrorResponse(ws, requestId, 404, "Unauthorized");
          return;
        }

        if (!(await user.isValidPassword(userInfo.password))) {
          sendErrorResponse(ws, requestId, 404, "Unauthorized");
          return;
        }

        const userSession = new UserSession({ user_id: user.params._id });
        await userSession.save();

        ACTIVE_SESSIONS[ws] = { userSession: userSession.params };

        const respData = {
          token: userSession.params._id,
          user: user.visibleParams(),
        };

        ws.send(
          JSON.stringify({ response: { id: requestId, user: respData } })
        );
      } else if (json.request.user_logout) {
        //Logout
        console.log("Logout...");

        const sessionId = json.request.user_logout.token;
        const userSession = await UserSession.findOne({ _id: sessionId });
        userLogoutById(ws, requestId, userSession);
      } else if (json.request.user_delete) {
        //Delete
        console.log("Delete...");

        const userSession = ACTIVE_SESSIONS[ws].userSession;
        if (userSession.user_id.toString() !== json.request.user_delete.id) {
          sendErrorResponse(ws, requestId, 403, "Forbidden");
          return;
        }

        const userId = json.request.user_delete.id;
        const currentUserSession = await UserSession.findUserSession({
          user_id: userId,
        });

        userLogoutById(ws, requestId, currentUserSession);

        const user = await User.findOne({ _id: userId });
        if (user) {
          await user.delete();
          ws.send(
            JSON.stringify({ response: { id: requestId, success: true } })
          );
        } else {
          sendErrorResponse(ws, requestId, 404, "Unauthorized");
        }
      }
    },
  });
}
