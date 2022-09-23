import ACTIVE from "../models/active.js";
import Conversation from "../models/conversation.js";
import ConversationController from "./conversations.js";
import ConversationParticipant from "../models/conversation_participant.js";
import Messages from "../models/message.js";
import OfflineQueue from "../models/offline_queue.js";
import { ALLOW_FIELDS } from "../constants/fields_constants.js";
import { CONSTANTS } from "../constants/constants.js";
import { ERROR_STATUES } from "../constants/http_constants.js";
import { ObjectId } from "mongodb";
import { slice } from "../utils/req_res_utils.js";

async function deliverToUser(userId, request) {
  const wsRecipient = ACTIVE.CONNECTIONS[userId];

  if (wsRecipient) {
    wsRecipient.send({ message: request });
  } else {
    request = new OfflineQueue({ user_id: userId, request: request });
    await request.save();
  }
}

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
    if (!messageParams.deleted_for) {
      messageParams.deleted_for = [];
    }

    const message = new Messages(messageParams);
    const currentTs = Math.round(parseFloat(Date.now()) / 1000);
    message.params.t = parseInt(currentTs);

    await message.save();

    if (messageParams.to) {
      await deliverToUser(ObjectId(messageParams.to), message);
    } else if (messageParams.cid) {
      const participants = await ConversationParticipant.findAll(
        {
          conversation_id: messageParams.cid,
        },
        "user_id",
        100
      );
      participants.forEach(async (userId) => {
        await deliverToUser(userId, message);
      });
    }
    return { ask: { mid: messageId, t: currentTs } };
  }

  async edit(ws, data) {
    const requestId = data.request.id;
    const messageParams = data.request.message_edit;

    if (!messageParams.id) {
      return {
        response: {
          id: requestId,
          error: ERROR_STATUES.MESSAGE_ID_MISSED,
        },
      };
    }
    const messageId = messageParams.id;
    let message = await Messages.findOne({ id: messageId });
    if (!message) {
      return {
        response: {
          id: requestId,
          error: ERROR_STATUES.MESSAGE_ID_NOT_FOUND,
        },
      };
    }

    if (
      ACTIVE.SESSIONS[ws].userSession.user_id.toString() != message.params.from
    ) {
      return {
        response: {
          id: requestId,
          error: ERROR_STATUES.FORBIDDEN,
        },
      };
    }
    if (!messageParams.body) {
      return {
        response: {
          id: requestId,
          error: ERROR_STATUES.BODY_IS_EMPTY,
        },
      };
    }
    await Messages.updateOne(
      { id: messageId },
      { $set: { body: messageParams.body } }
    );
    const request = {
      message_edit: {
        id: messageId,
        body: messageParams.body,
        from: ACTIVE.SESSIONS[ws].userSession.user_id,
      },
    };
    if (message.params.cid) {
      const conversationParticipants = await ConversationParticipant.findAll(
        {
          conversation_id: message.params.cid,
        },
        "user_id",
        100
      );
      conversationParticipants.forEach(async (user) => {
        deliverToUser(user, request);
      });
    } else if (message.params.to) {
      deliverToUser(message.params.to, request);
    }

    return { response: { id: requestId, success: true } };
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
    const requestType = data.request.message_delete.type;
    if (
      !requestType ||
      !CONSTANTS.MESSADEGE_DELETE_TYPES.includes(requestType)
    ) {
      return {
        response: {
          id: requestId,
          error: ERROR_STATUES.INCORRECT_TYPE,
        },
      };
    }

    const conversationId = data.request.message_delete.cid;
    if (
      !conversationId ||
      !(await Conversation.findOne({ _id: conversationId }))
    ) {
      return {
        response: {
          id: requestId,
          error: ERROR_STATUES.CONVERSATION_NOT_FOUND,
        },
      };
    }

    const messagesIds = data.request.message_delete.ids;
    if (!messagesIds || messagesIds.length == 0) {
      return {
        response: {
          id: requestId,
          error: ERROR_STATUES.MESSAGE_ID_MISSED,
        },
      };
    }

    if (requestType == "all") {
      const participants = await ConversationParticipant.findAll(
        {
          conversation_id: conversationId,
        },
        "user_id",
        100
      );
      participants.forEach((user) => {
        const request = {
          message_delete: {
            cid: conversationId,
            ids: messagesIds,
            type: "all",
            from: ACTIVE.SESSIONS[ws].userSession.user_id,
          },
        };
        deliverToUser(user, request);
      });
      await Messages.deleteMany({ id: { $in: messagesIds } });
    } else {
      await Messages.updateMany(
        { id: { $in: messagesIds } },
        {
          $addToSet: {
            deleted_for: ACTIVE.SESSIONS[ws].userSession.user_id.toString(),
          },
        }
      );
    }

    return {
      response: {
        id: requestId,
        success: true,
      },
    };
  }
}
