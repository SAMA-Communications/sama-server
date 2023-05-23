import BaseController from "./base/base.js";
import BlockListRepository from "../repositories/blocklist_repository.js";
import BlockedUser from "../models/blocked_user.js";
import Conversation from "../models/conversation.js";
import ConversationParticipant from "../models/conversation_participant.js";
import ConversationRepository from "../repositories/conversation_repository.js";
import Message from "../models/message.js";
import MessageStatus from "../models/message_status.js";
import SessionRepository from "../repositories/session_repository.js";
import groupBy from "../utils/groupBy.js";
import validate, {
  validateIsConversation,
  validateIsConversationByCID,
  validateIsUserAccess,
} from "../lib/validation.js";
import {
  inMemoryBlockList,
  inMemoryConversations,
} from "../store/in_memory.js";
import { ACTIVE } from "../store/session.js";
import { CONSTANTS } from "../validations/constants/constants.js";
import { ERROR_STATUES } from "../validations/constants/errors.js";
import { ObjectId } from "mongodb";
import { default as PacketProcessor } from "../routes/packet_processor.js";

class MessagesController extends BaseController {
  constructor() {
    super();
    this.conversationRepository = new ConversationRepository(
      Conversation,
      inMemoryConversations
    );
    this.blockListRepository = new BlockListRepository(
      BlockedUser,
      inMemoryBlockList
    );
    this.sessionRepository = new SessionRepository(ACTIVE);
  }

  async create(ws, data) {
    const { message: messageParams } = data;
    const messageId = messageParams.id;

    const currentUserId = this.sessionRepository.getSessionUserId(ws);
    const conversation = await this.conversationRepository.findById(
      messageParams.cid
    );

    let participants;
    if (conversation) {
      participants = await ConversationParticipant.findAll({
        conversation_id: conversation._id,
      });
      participants = participants?.map((u) => u.user_id.toString());
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
    if (conversation.type === "u") {
      const recipentsThatChatNotVisible = [
        conversation.opponent_id,
        conversation.owner_id.toString(),
      ].filter((u) => !participants.includes(u));

      if (recipentsThatChatNotVisible.length) {
        for (let userId of recipentsThatChatNotVisible) {
          const participant = new ConversationParticipant({
            user_id: ObjectId(userId),
            conversation_id: conversation._id,
          });
          await participant.save();
        }

        await PacketProcessor.deliverToUserOrUsers(
          ws,
          {
            conversation_create: {
              ...conversation,
              unread_messages_count: 0,
              messagesIds: [],
            },
            id: messageId,
          },
          conversation._id,
          recipentsThatChatNotVisible
        );
      }
    }

    await PacketProcessor.deliverToUserOrUsers(
      ws,
      message.visibleParams(),
      messageParams.cid
    );

    await this.conversationRepository.updateOne(messageParams.cid, {
      updated_at: message.params.created_at,
    });

    return {
      ask: { mid: messageId, server_mid: message.params._id, t: currentTs },
    };
  }

  //TODO: add attachments change support
  async edit(ws, data) {
    const { id: requestId, message_edit: messageParams } = data;
    const messageId = messageParams.id;

    let message = await Message.findOne({ _id: messageId });
    if (!message) {
      throw new Error(ERROR_STATUES.MESSAGE_ID_NOT_FOUND.message, {
        cause: ERROR_STATUES.MESSAGE_ID_NOT_FOUND,
      });
    }
    await validate(ws, message.params, [validateIsUserAccess]);

    await Message.updateOne(
      { _id: messageId },
      { $set: { body: messageParams.body } }
    );
    const request = {
      message_edit: {
        id: messageId,
        body: messageParams.body,
        from: ObjectId(this.sessionRepository.getSessionUserId(ws)),
      },
    };
    await PacketProcessor.deliverToUserOrUsers(ws, request, message.params.cid);

    return { response: { id: requestId, success: true } };
  }

  async list(ws, data) {
    const {
      id: requestId,
      message_list: { cid, limit, updated_at },
    } = data;
    await validate(ws, { id: cid }, [validateIsConversation]);

    const limitParam =
      limit > CONSTANTS.LIMIT_MAX
        ? CONSTANTS.LIMIT_MAX
        : limit || CONSTANTS.LIMIT_MAX;

    const query = {
      cid,
      deleted_for: { $nin: [this.sessionRepository.getSessionUserId(ws)] },
    };
    const timeFromUpdate = updated_at;
    if (timeFromUpdate && timeFromUpdate.gt) {
      query.updated_at = { $gt: new Date(timeFromUpdate.gt) };
    }

    const messages = await Message.findAll(
      query,
      Message.visibleFields,
      limitParam
    );
    const messagesStatus = await MessageStatus.getReadStatusForMids(
      messages.map((msg) => msg._id)
    );

    return {
      response: {
        id: requestId,
        messages: messages.map((msg) => {
          if (
            msg.from.toString() === this.sessionRepository.getSessionUserId(ws)
          ) {
            msg["status"] = messagesStatus[msg._id]?.length ? "read" : "sent";
          }
          return msg;
        }),
      },
    };
  }

  async read(ws, data) {
    const {
      id: requestId,
      message_read: { cid, ids: mids },
    } = data;
    const uId = this.sessionRepository.getSessionUserId(ws);

    const query = { cid, user_id: uId };
    const filters = { cid, from: { $ne: uId } };
    if (mids) {
      filters._id = { $in: mids };
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

      const messagesToDeliver = {};
      for (const uId in unreadMessagesGrouppedByFrom) {
        const mids = unreadMessagesGrouppedByFrom[uId].map((el) => el._id);
        messagesToDeliver[uId] = {
          message_read: {
            cid: ObjectId(cid),
            ids: mids,
            from: ObjectId(uId),
          },
        };
      }

      await PacketProcessor.deliverToUserOrUsers(
        ws,
        messagesToDeliver,
        cid,
        Object.keys(unreadMessagesGrouppedByFrom)
      );
    }

    return {
      response: {
        id: requestId,
        success: true,
      },
    };
  }

  async delete(ws, data) {
    const {
      id: requestId,
      message_delete: { type, cid, ids },
    } = data;
    await validate(ws, { cid }, [validateIsConversationByCID]);

    if (type == "all") {
      const participants = await ConversationParticipant.findAll(
        { conversation_id: cid },
        ["user_id"],
        100
      );
      for (const user in participants) {
        const request = {
          message_delete: {
            cid,
            ids,
            type: "all",
            from: ObjectId(this.sessionRepository.getSessionUserId(ws)),
          },
        };

        await PacketProcessor.deliverToUserOrUsers(ws, request, cid);
      }
      await Message.deleteMany({ _id: { $in: ids } });
    } else {
      await Message.updateMany(
        { id: { $in: ids } },
        {
          $addToSet: {
            deleted_for: ObjectId(this.sessionRepository.getSessionUserId(ws)),
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

export default new MessagesController();
