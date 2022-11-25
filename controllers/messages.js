import Conversation from "../models/conversation.js";
import ConversationController from "./conversations.js";
import ConversationParticipant from "../models/conversation_participant.js";
import Messages from "../models/message.js";
import MessageStatus from "../models/message_status.js";
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
import groupBy from "../utils/groupBy.js";
import { ALLOW_FIELDS } from "../constants/fields_constants.js";
import { CONSTANTS } from "../constants/constants.js";
import { ObjectId } from "mongodb";
import { deliverToUser, deliverToUserOrUsers } from "../routes/ws.js";
import { ACTIVE, getSessionUserId } from "../models/active.js";
import { slice } from "../utils/req_res_utils.js";

export default class MessagesController {
  async create(ws, data) {
    const messageParams = slice(
      data.message,
      ALLOW_FIELDS.ALLOWED_FILEDS_MESSAGE
    );
    await validate(ws, messageParams, [validateMessageBody, validateTOorCID]);

    const messageId = data.message.id;
    await validate(ws, { id: messageId }, [validateMessageId]);

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
    await deliverToUserOrUsers(messageParams, message.visibleParams(), ws);

    await Conversation.updateOne(
      { _id: messageParams.cid },
      { $set: { updated_at: new Date(Date.now()).toISOString() } }
    );
    return {
      ask: { mid: messageId, server_mid: message.params._id, t: currentTs },
    };
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
    await deliverToUserOrUsers(message.params, request, getSessionUserId(ws));

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
    if (timeFromUpdate && timeFromUpdate.gt) {
      query.updated_at = { $gt: new Date(timeFromUpdate.gt) };
    }

    const messages = await Messages.findAll(
      query,
      Messages.visibleFields,
      limit
    );
    const messagesStatus = await MessageStatus.getReadStatusForMids(
      messages.map((msg) => msg._id)
    );
    console.log(messagesStatus);
    return {
      response: {
        id: requestId,
        messages: messages.map((msg) => {
          msg["status"] = messagesStatus[msg._id].length ? "read" : "sent";
          return msg;
        }),
      },
    };
  }

  async read(ws, data) {
    const requestId = data.request.id;
    const cid = data.request.message_read.cid;
    const uId = getSessionUserId(ws);

    const query = {
      cid: cid,
      user_id: uId,
    };
    if (data.request.message_read.ids) {
      query.mid = { $in: data.request.message_read.ids };
    }
    const lastReadMessage = (await MessageStatus.findAll(query, ["mid"], 1))[0];

    const filters = { cid: cid, from: { $ne: uId } };
    if (lastReadMessage) {
      filters._id = { $gt: lastReadMessage.mid };
    }
    const unreadMessages = await Messages.findAll(filters);

    if (unreadMessages.length) {
      const insertMessages = unreadMessages.map((msg) => {
        return {
          cid: ObjectId(cid),
          mid: ObjectId(msg._id),
          user_id: ObjectId(uId),
          status: "read",
        };
      });
      await MessageStatus.insertMany(insertMessages.reverse());
      const unreadMessagesGrouppedByFrom = groupBy(unreadMessages, "from");
      await this.deliverStatusToUsers(unreadMessagesGrouppedByFrom, cid, ws);
    }

    return {
      response: {
        id: requestId,
        success: true,
      },
    };
  }

  async deliverStatusToUsers(midsByUId, cid, currentWS) {
    const participantsIds = Object.keys(midsByUId);
    participantsIds.forEach((uId) => {
      const wsRecipient = ACTIVE.DEVICES[uId];

      if (wsRecipient) {
        wsRecipient.forEach((data) => {
          if (data.ws !== currentWS) {
            const message = {
              message_read: {
                cid: ObjectId(cid),
                ids: midsByUId[uId],
                from: ObjectId(uId),
              },
            };
            data.ws.send(JSON.stringify({ message }));
          }
        });
      }
    });
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
        ["user_id"],
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
      await Messages.deleteMany({ _id: { $in: messagesIds } });
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
