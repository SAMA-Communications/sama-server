import Conversation from "../models/conversation.js";
import ConversationController from "./conversations.js";
import ConversationParticipant from "../models/conversation_participant.js";
import Messages from "../models/message.js";
import validate, {
  validateIsConversation,
  validateIsConversationByCID,
  validateIsMessageById,
  validateIsUserAccess,
  validateMessageBody,
  validateMessageDeleteType,
  validateMessageId,
  validateTOorCID,
} from "../lib/validation.js";
import { ALLOW_FIELDS } from "../constants/fields_constants.js";
import { CONSTANTS } from "../constants/constants.js";
import { ObjectId } from "mongodb";
import { deliverToUser, deliverToUserOrUsers } from "../routes/ws.js";
import { getSessionUserId } from "../models/active.js";
import { slice } from "../utils/req_res_utils.js";

export default class MessagesController {
  async create(ws, data) {
    const messageParams = slice(
      data.message,
      ALLOW_FIELDS.ALLOWED_FILEDS_MESSAGE
    );

    await validate(ws, messageParams, [
      validateMessageId,
      validateMessageBody,
      validateTOorCID,
    ]);
    const messageId = data.message.id;

    if (messageParams.cid) {
      await validate(ws, messageParams, [validateIsConversationByCID]);
    } else if (messageParams.to) {
      let conversation = await Conversation.findOne({
        $or: [
          {
            type: "u",
            owner_id: ObjectId(getSessionUserId(ws)),
            opponent_id: messageParams.to.toString(),
          },
          {
            type: "u",
            owner_id: ObjectId(messageParams.to),
            opponent_id: getSessionUserId(ws),
          },
        ],
      });
      if (!conversation) {
        const requestData = {
          request: {
            conversation_create: {
              type: "u",
              owner_id: ObjectId(getSessionUserId(ws)),
              opponent_id: messageParams.to,
              participants: [messageParams.to, ObjectId(getSessionUserId(ws))],
            },
            id: "0",
          },
        };
        await new ConversationController().create(ws, requestData);
      }
    }

    messageParams.from = ObjectId(getSessionUserId(ws));
    if (!messageParams.deleted_for) {
      messageParams.deleted_for = [];
    }

    const message = new Messages(messageParams);
    message.params.cid
      ? (message.params.cid = ObjectId(message.params.cid))
      : (message.params.to = ObjectId(message.params.to));
    const currentTs = Math.round(Date.now() / 1000);
    message.params.t = parseInt(currentTs);

    await message.save();
    await deliverToUserOrUsers(messageParams, message);

    return { ask: { mid: messageId, t: currentTs } };
  }

  async edit(ws, data) {
    const requestId = data.request.id;
    const messageParams = data.request.message_edit;

    await validate(ws, messageParams, [validateMessageId, validateMessageBody]);

    const messageId = messageParams.id;
    await validate(ws, { mid: messageId }, [validateIsMessageById]);
    let message = await Messages.findOne({ id: messageId });
    await validate(ws, message.params, [validateIsUserAccess]);

    await Messages.updateOne(
      { id: messageId },
      { $set: { body: messageParams.body } }
    );
    const request = {
      message_edit: {
        id: messageId,
        body: messageParams.body,
        from: ObjectId(getSessionUserId(ws)),
      },
    };
    await deliverToUserOrUsers(message.params, request);

    return { response: { id: requestId, success: true } };
  }

  async list(ws, data) {
    const requestId = data.request.id;

    const cid = data.request.message_list.cid;
    await validate(ws, { id: cid }, [validateIsConversation]);
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
    await validate(ws, { type: requestType }, [validateMessageDeleteType]);

    const conversationId = data.request.message_delete.cid;
    await validate(ws, { cid: conversationId }, [validateIsConversationByCID]);

    const messagesIds = data.request.message_delete.ids;
    await validate(ws, { id: messagesIds }, [validateMessageId]);

    if (requestType == "all") {
      const participants = await ConversationParticipant.findAll(
        {
          conversation_id: conversationId,
        },
        "user_id",
        100
      );
      for (const user in participants) {
        const request = {
          message_delete: {
            cid: conversationId,
            ids: messagesIds,
            type: "all",
            from: ObjectId(getSessionUserId(ws)),
          },
        };
        await deliverToUser(user, request);
      }
      await Messages.deleteMany({ id: { $in: messagesIds } });
    } else {
      await Messages.updateMany(
        { id: { $in: messagesIds } },
        {
          $addToSet: {
            deleted_for: ObjectId(getSessionUserId(ws)),
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
