import BlockListRepository from "../repositories/blocklist_repository.js";
import BlockedUser from "../models/blocked_user.js";
import Conversation from "../models/conversation.js";
import ConversationParticipant from "../models/conversation_participant.js";
import ConversationRepository from "../repositories/conversation_repository.js";
import MessageStatus from "../models/message_status.js";
import Message from "../models/message.js";
import groupBy from "../utils/groupBy.js";
import validate, {
  validateIsConversation,
  validateIsConversationByCID,
  validateIsMessageById,
  validateIsUserAccess,
  validateMessageBody,
  validateMessageDeleteType,
  validateMessageId,
  validateIsCID,
} from "../lib/validation.js";
import {
  inMemoryBlockList,
  inMemoryConversations,
} from "../store/in_memory.js";
import { ALLOW_FIELDS } from "../constants/fields_constants.js";
import { CONSTANTS } from "../constants/constants.js";
import { ObjectId } from "mongodb";
import { deliverToUserOnThisNode, deliverToUserOrUsers } from "../routes/ws.js";
import { ACTIVE, getSessionUserId } from "../store/session.js";
import { slice } from "../utils/req_res_utils.js";
import { ERROR_STATUES } from "../constants/http_constants.js";

export default class MessagesController {
  constructor() {
    this.conversationRepository = new ConversationRepository(
      Conversation,
      inMemoryConversations
    );
    this.blockListRepository = new BlockListRepository(
      BlockedUser,
      inMemoryBlockList
    );
  }

  async create(ws, data) {
    const messageParams = slice(
      data.message,
      ALLOW_FIELDS.ALLOWED_FILEDS_MESSAGE
    );

    await validate(ws, messageParams, [validateMessageBody, validateIsCID]);

    const messageId = data.message.id;
    await validate(ws, { id: messageId }, [validateMessageId]);

    const currentUserId = getSessionUserId(ws);
    const conversation = await this.conversationRepository.findById(
      messageParams.cid
    );

    let participants;
    if (conversation) {
      participants = await ConversationParticipant.findAll({
        conversation_id: conversation._id,
      });
      participants = participants?.map((el) => el.user_id.toString());
      if (!participants.includes(currentUserId)) {
        throw new Error(ERROR_STATUES.FORBIDDEN.message, {
          cause: ERROR_STATUES.FORBIDDEN,
        });
      }
    } else {
      throw new Error(ERROR_STATUES.CONVERSATION_NOT_FOUND.message, {
        cause: ERROR_STATUES.CONVERSATION_NOT_FOUND,
      });
    }

    const blockedUsersIds = await this.blockListRepository.getBlockingUsers(
      currentUserId,
      participants
    );

    if (conversation.type === "u" && blockedUsersIds.length) {
      throw new Error(ERROR_STATUES.USER_BLOCKED.message, {
        cause: ERROR_STATUES.USER_BLOCKED,
      });
    }
    if (
      conversation.type === "g" &&
      blockedUsersIds.length === participants.length - 1
    ) {
      throw new Error(ERROR_STATUES.USER_BLOCKED_FOR_ALL_PARTICIPANTS.message, {
        cause: ERROR_STATUES.USER_BLOCKED_FOR_ALL_PARTICIPANTS,
      });
    }

    messageParams.deleted_for = blockedUsersIds;
    messageParams.from = ObjectId(currentUserId);

    const message = new Message(messageParams);
    message.params.cid = message.params.cid
      ? ObjectId(message.params.cid)
      : message.params.cid;
    const currentTs = Math.round(Date.now() / 1000);
    message.params.t = parseInt(currentTs);

    await message.save();
    await deliverToUserOrUsers(messageParams, message.visibleParams(), ws);

    await this.conversationRepository.updateOne(messageParams.cid, {
      updated_at: message.params.created_at,
    });

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
    let message = await Message.findOne({ _id: messageId });
    await validate(ws, message.params, [validateIsUserAccess]);

    await Message.updateOne(
      { _id: messageId },
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
      deleted_for: { $nin: [getSessionUserId(ws)] },
    };
    const timeFromUpdate = data.request.message_list.updated_at;
    if (timeFromUpdate && timeFromUpdate.gt) {
      query.updated_at = { $gt: new Date(timeFromUpdate.gt) };
    }

    const messages = await Message.findAll(query, Message.visibleFields, limit);
    const messagesStatus = await MessageStatus.getReadStatusForMids(
      messages.map((msg) => msg._id)
    );

    return {
      response: {
        id: requestId,
        messages: messages.map((msg) => {
          if (msg.from.toString() === getSessionUserId(ws)) {
            msg["status"] = messagesStatus[msg._id]?.length ? "read" : "sent";
          }
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

    const filters = { cid: cid, from: { $ne: uId } };
    if (data.request.message_read.ids) {
      filters._id = { $in: data.request.message_read.ids };
    } else {
      const lastReadMessage = (
        await MessageStatus.findAll(query, ["mid"], 1)
      )[0];
      if (lastReadMessage) {
        filters._id = { $gt: lastReadMessage.mid };
      }
    }

    const unreadMessages = await Message.findAll(filters);

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
                ids: midsByUId[uId].map((el) => el._id),
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
        await deliverToUserOnThisNode(user, request);
      }
      await Message.deleteMany({ _id: { $in: messagesIds } });
    } else {
      await Message.updateMany(
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
