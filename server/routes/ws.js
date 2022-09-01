import User from "../models/user.js";
import { ObjectId } from "../lib/db.js";
import UserSession from "../models/user_session.js";
import Conversation from "../models/conversation.js";
import ConversationParticipant from "../models/conversation_participant.js";
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

      if (
        !json.request.user_create &&
        !json.request.user_login &&
        !ACTIVE_SESSIONS[ws]
      ) {
        sendErrorResponse(ws, requestId, 404, "Unauthorized");
        return;
      }

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
        const currentUserSession = await UserSession.findOne({
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
      } else if (json.request.conversation_create) {
        //Create conversation
        console.log("Create conversation...");

        const [allowedFields, participantsFields] = [
          ["name", "description"],
          ["participants"],
        ];
        const participantsParams = slice(
          json.request.conversation_create,
          participantsFields
        );
        participantsParams.participants = await User.getAllIdsBy({
          _id: { $in: participantsParams.participants },
        });

        if (participantsParams.participants?.length === 0) {
          sendErrorResponse(ws, requestId, 422, "Select at least one user");
          return;
        }

        const conversationParams = slice(
          json.request.conversation_create,
          allowedFields
        );
        conversationParams.owner_id = ACTIVE_SESSIONS[ws].userSession.user_id;
        const conversationObj = new Conversation(conversationParams);
        await conversationObj.save();

        participantsParams.participants.forEach(async (user) => {
          const participantObj = new ConversationParticipant({
            user_id: user,
            conversation_id: conversationObj.params._id,
          });
          await participantObj.save();
        });

        ws.send(
          JSON.stringify({
            response: {
              id: requestId,
              conversation: conversationObj,
            },
          })
        );
      } else if (json.request.conversation_delete) {
        //Delete conversation
        console.log("Delete conversation...");

        const conversationId = json.request.conversation_delete.id;
        const conversation = await Conversation.findOne({
          _id: conversationId,
        });

        if (!conversation) {
          sendErrorResponse(ws, requestId, 404, "Conversation not found");
          return;
        }

        const conversationParticipant = await ConversationParticipant.findOne({
          user_id: ACTIVE_SESSIONS[ws].userSession.user_id,
          conversation_id: conversationId,
        });
        if (!conversationParticipant) {
          sendErrorResponse(
            ws,
            requestId,
            404,
            "ConversationParticipant not found"
          );
          return;
        }
        await conversationParticipant.delete();
        const isUserInConvesation = await ConversationParticipant.findOne({
          conversation_id: conversationId,
        });
        if (!isUserInConvesation) {
          await conversation.delete();
        } else if (
          conversation.params.owner_id.toString() ===
          ACTIVE_SESSIONS[ws].userSession.user_id.toString()
        ) {
          Conversation.update(
            { _id: conversationId },
            { $set: { owner_id: isUserInConvesation.params.user_id } }
          );
        }
        ws.send(JSON.stringify({ response: { id: requestId, success: true } }));
      } else if (json.request.conversation_update) {
        //Update conversation
        console.log("Update conversation...");
        const requestData = json.request.conversation_update;

        const conversation = await Conversation.findOne({ _id: requestData });
        if (!requestData.id || !conversation) {
          sendErrorResponse(ws, requestId, 400, "Bad Request");
          return;
        }

        if (
          conversation.params.owner_id.toString() !==
          ACTIVE_SESSIONS[ws].userSession.user_id.toString()
        ) {
          sendErrorResponse(ws, requestId, 403, "Forbidden");
          return;
        }
        const conversationId = requestData.id;
        delete requestData.id;

        let isOwnerChange = false;
        if (
          requestData.participants &&
          Object.keys(requestData.participants) != 0
        ) {
          const participantsToUpdate = requestData.participants;
          delete requestData.participants;

          const addUsers = participantsToUpdate.add;
          const removeUsers = participantsToUpdate.remove;
          if (addUsers) {
            for (let i = 0; i < addUsers.length; i++) {
              const obj = new ConversationParticipant({
                user_id: ObjectId(addUsers[i]),
                conversation_id: ObjectId(conversationId),
              });
              if (
                !(await ConversationParticipant.findOne({
                  user_id: addUsers[i],
                  conversation_id: conversationId,
                }))
              ) {
                await obj.save();
              }
            }
          }
          if (removeUsers) {
            for (let i = 0; i < removeUsers.length; i++) {
              const obj = await ConversationParticipant.findOne({
                user_id: removeUsers[i],
                conversation_id: conversationId,
              });
              if (!!obj) {
                if (
                  conversation.params.owner_id.toString() ===
                  obj.params.user_id.toString()
                ) {
                  isOwnerChange = true;
                }
                await obj.delete();
              }
            }
          }
        }
        if (isOwnerChange) {
          const isUserInConvesation = await ConversationParticipant.findOne({
            conversation_id: conversationId,
          });
          requestData.owner_id = isUserInConvesation.params.user_id;
        }
        isOwnerChange = false;
        if (Object.keys(requestData) != 0) {
          await Conversation.update(
            { _id: conversationId },
            { $set: requestData }
          );
        }

        const returnConversation = await Conversation.findOne({
          _id: conversationId,
        });
        ws.send(
          JSON.stringify({
            response: {
              id: requestId,
              conversation: returnConversation,
            },
          })
        );
      }
    },
  });
}
