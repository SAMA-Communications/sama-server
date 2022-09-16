import ACTIVE from "../models/active.js";
import Conversation from "../models/conversation.js";
import ConversationController from "./conversations.js";
import ConversationParticipant from "../models/conversation_participant.js";
import Messages from "../models/message.js";
import User from "../models/user.js";
import { ALLOW_FIELDS } from "../constants/fields_constants.js";
import { CONSTANTS } from "../constants/constants.js";
import { ERROR_STATUES } from "../constants/http_constants.js";
import { slice } from "../utils/req_res_utils.js";
import { ObjectId } from "mongodb";

export default class MessagesController {
  async create(ws, data) {
    const messageParams = slice(
      data.message,
      ALLOW_FIELDS.ALLOWED_FILEDS_MESSAGES
    );

    if (!messageParams.id) {
      return {
        message: {
          id: "0",
          error: ERROR_STATUES.MESSAGE_ID_NOT_FOUND,
        },
      };
    }

    const messageId = data.message.id;
    if (!messageParams.body) {
      return {
        message: {
          id: messageId,
          error: ERROR_STATUES.BODY_IS_EMPTY,
        },
      };
    }

    if (!messageParams.to && !messageParams.cid) {
      return {
        message: {
          id: messageId,
          error: ERROR_STATUES.EITHER_TO_OR_CID_REQUIRED,
        },
      };
    }

    if (messageParams.cid) {
      const conversation = await Conversation.findOne({
        _id: messageParams.cid,
      });
      if (conversation) {
        const participant = await ConversationParticipant.findOne({
          conversation_id: conversation.params._id,
          user_id: ACTIVE.SESSIONS[ws].userSession.user_id,
        });
        if (!participant) {
          return {
            message: {
              id: messageId,
              error: ERROR_STATUES.FORBIDDEN,
            },
          };
        }
      } else {
        return {
          message: {
            id: messageId,
            error: ERROR_STATUES.CONVERSATION_NOT_FOUND,
          },
        };
      }
    } else if (messageParams.to) {
      let conversation = await Conversation.findOne({
        $or: [
          {
            type: "u",
            owner_id: ACTIVE.SESSIONS[ws].userSession.user_id,
            recipient: messageParams.to,
          },
          {
            type: "u",
            owner_id: ObjectId(messageParams.to),
            recipient: ACTIVE.SESSIONS[ws].userSession.user_id.toString(),
          },
        ],
      });
      if (!conversation) {
        const requestData = {
          request: {
            conversation_create: {
              type: "u",
              owner_id: ACTIVE.SESSIONS[ws].userSession.user_id,
              recipient: messageParams.to,
              participants: [
                messageParams.to,
                ACTIVE.SESSIONS[ws].userSession.user_id,
              ],
            },
            id: "0",
          },
        };
        await new ConversationController().create(ws, requestData);
      }
    }

    messageParams.from = ACTIVE.SESSIONS[ws].userSession.user_id.toString();

    const message = new Messages(messageParams);
    const currentTs = Math.round(parseFloat(Date.now()) / 10000);
    message.params.t = parseInt(currentTs);
    await message.save();

    const wsRecipient = ACTIVE.CONNECTIONS[messageParams.to];
    if (wsRecipient) {
      wsRecipient.send({ message: message });
    }
    return { ask: { mid: messageId, t: currentTs } };
  }

  async list(ws, data) {
    const requestId = data.request.id;

    const cid = data.request.message_list.cid;
    const limit =
      data.request.message_list.limit > CONSTANTS.LIMIT_MAX
        ? CONSTANTS.LIMIT_MAX
        : data.request.message_list.limit || CONSTANTS.LIMIT_MAX;

    const query = {
      cid: cid,
    };
    const timeFromUpdate = data.request.message_list.updated_at;
    if (timeFromUpdate) {
      query.updated_at = { $gt: new Date(timeFromUpdate.gt) };
    }
    const messages = await Messages.findAll(query, null, limit);

    return {
      response: {
        id: requestId,
        messages: messages,
      },
    };
  }

  async delete(ws, data) {
    const requestId = data.request.id;

    const messageId = data.request.message_delete.id;
    const messageFrom = data.request.message_delete.from;
    const message = await Messages.findOne({
      id: messageId,
      from: messageFrom,
    });

    if (message) {
      await message.delete();
      return {
        message: {
          id: requestId,
          success: true,
        },
      };
    } else {
      return {
        message: {
          id: requestId,
          error: ERROR_STATUES.BAD_REQUEST,
        },
      };
    }
  }
}
