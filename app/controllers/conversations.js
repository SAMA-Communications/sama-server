import BaseController from "./base/base.js";
import Conversation from "../models/conversation.js";
import ConversationParticipant from "../models/conversation_participant.js";
import ConversationRepository from "../repositories/conversation_repository.js";
import Message from "../models/message.js";
import SessionRepository from "../repositories/session_repository.js";
import User from "../models/user.js";
import validate, {
  validateConversationisUserOwner,
  validateIsConversation,
  validateIsUserSendHimSelf,
  validateParticipantsInUType,
  validateParticipantsLimit,
} from "../lib/validation.js";
import { CONSTANTS } from "../constants/constants.js";
import { ERROR_STATUES } from "../constants/http_constants.js";
import { ObjectId } from "mongodb";
import { inMemoryConversations } from "../store/in_memory.js";
import { ACTIVE } from "../store/session.js";

class ConversationsController extends BaseController {
  constructor() {
    super();
    this.conversationRepository = new ConversationRepository(
      Conversation,
      inMemoryConversations
    );
    this.sessionRepository = new SessionRepository(ACTIVE);
  }

  async create(ws, data) {
    const { id: requestId, conversation_create: conversationParams } = data;
    const participants = await User.getAllIdsBy({
      _id: { $in: conversationParams.participants },
    });

    conversationParams.owner_id = ObjectId(
      this.sessionRepository.getSessionUserId(ws)
    );
    if (conversationParams.type == "u") {
      await validate(
        ws,
        { participants, opponent_id: conversationParams.opponent_id },
        [validateParticipantsInUType, validateIsUserSendHimSelf]
      );

      const existingConversation = await this.conversationRepository.findOne({
        $or: [
          {
            type: "u",
            owner_id: ObjectId(this.sessionRepository.getSessionUserId(ws)),
            opponent_id: conversationParams.opponent_id,
          },
          {
            type: "u",
            owner_id: ObjectId(conversationParams.opponent_id),
            opponent_id: this.sessionRepository.getSessionUserId(ws),
          },
        ],
      });
      if (existingConversation)
        return {
          response: {
            id: requestId,
            conversation: existingConversation,
          },
        };
    }

    let isOwnerInArray = false;
    participants.forEach((el) => {
      if (JSON.stringify(el) === JSON.stringify(conversationParams.owner_id)) {
        isOwnerInArray = true;
        return;
      }
    });
    if (!isOwnerInArray) {
      participants.push(ObjectId(conversationParams.owner_id));
    } else if (participants.length === 1) {
      return {
        response: {
          id: requestId,
          error: ERROR_STATUES.PARTICIPANTS_NOT_PROVIDED,
        },
      };
    }

    const conversationObj = new Conversation(conversationParams);
    await conversationObj.save();

    for (let userId of participants) {
      const participant = new ConversationParticipant({
        user_id: userId,
        conversation_id: conversationObj.params._id,
      });
      await participant.save();
    }

    return {
      response: {
        id: requestId,
        conversation: conversationObj.visibleParams(),
      },
    };
  }

  async update(ws, data) {
    const { id: requestId, conversation_update: requestData } = data;
    await validate(ws, requestData, [validateIsConversation]);

    const conversationId = requestData.id;
    const conversation = await this.conversationRepository.findById(
      conversationId
    );
    await validate(ws, conversation, [validateConversationisUserOwner]);

    delete requestData.id;

    let isOwnerChange = false;
    if (
      requestData.participants &&
      Object.keys(requestData.participants) != 0
    ) {
      const participantsToUpdate = requestData.participants;
      delete requestData.participants;

      const { add: addUsers, remove: removeUsers } = participantsToUpdate;
      const countParticipants = await ConversationParticipant.count({
        conversation_id: conversationId,
      });
      if (addUsers) {
        await validate(ws, countParticipants + addUsers.length, [
          validateParticipantsLimit,
        ]);

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
              conversation.owner_id.toString() === obj.params.user_id.toString()
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
      await this.conversationRepository.updateOne(conversationId, requestData);
    }

    const returnConversation = await this.conversationRepository.findById(
      conversationId
    );

    return {
      response: {
        id: requestId,
        conversation: returnConversation,
      },
    };
  }

  async list(ws, data) {
    const {
      id: requestId,
      conversation_list: { limit, updated_at },
    } = data;

    const currentUser = this.sessionRepository.getSessionUserId(ws);
    const limitParam =
      limit > CONSTANTS.LIMIT_MAX
        ? CONSTANTS.LIMIT_MAX
        : limit || CONSTANTS.LIMIT_MAX;
    const userConversationsIds = await ConversationParticipant.findAll(
      {
        user_id: currentUser,
      },
      ["conversation_id"]
    );

    const query = {
      _id: {
        $in: userConversationsIds.map((p) => p.conversation_id),
      },
    };
    const timeFromUpdate = updated_at;
    if (timeFromUpdate && timeFromUpdate.gt) {
      query.updated_at = { $gt: new Date(timeFromUpdate.gt) };
    }

    const userConversations = await this.conversationRepository.findAll(
      query,
      null,
      limitParam
    );
    const lastMessagesListByCid = await Message.getLastMessageForConversation(
      userConversationsIds.map((el) => el.conversation_id),
      currentUser
    );

    const countOfUnreadMessagesByCid =
      await Message.getCountOfUnredMessagesByCid(
        userConversationsIds.map((el) => el.conversation_id),
        currentUser
      );

    for (const conv of userConversations) {
      const convId = conv._id.toString();
      conv["last_message"] = lastMessagesListByCid[convId];
      conv["unread_messages_count"] = countOfUnreadMessagesByCid[convId] || 0;
    }

    return {
      response: {
        id: requestId,
        conversations: userConversations,
      },
    };
  }

  async delete(ws, data) {
    const {
      id: requestId,
      conversation_delete: { id: conversationId },
    } = data;
    await validate(ws, { id: conversationId }, [validateIsConversation]);

    const conversation = await this.conversationRepository.findById(
      conversationId
    );

    const conversationParticipant = await ConversationParticipant.findOne({
      user_id: this.sessionRepository.getSessionUserId(ws),
      conversation_id: conversationId,
    });

    if (!conversationParticipant) {
      return {
        response: {
          id: requestId,
          error: ERROR_STATUES.PARTICIPANT_NOT_FOUND,
        },
      };
    }
    await conversationParticipant.delete();
    const isUserInConvesation = await ConversationParticipant.findOne({
      conversation_id: conversationId,
    });

    if (!isUserInConvesation) {
      await this.conversationRepository.delete(conversation);
    } else if (
      conversation.owner_id.toString() ===
      this.sessionRepository.getSessionUserId(ws)
    ) {
      await this.conversationRepository.updateOne(conversationId, {
        owner_id: isUserInConvesation.user_id,
      });
    }

    return { response: { id: requestId, success: true } };
  }

  async getParticipantsByCids(ws, data) {
    const {
      id: requestId,
      getParticipantsByCids: { cids },
    } = data;

    const participantIds = await ConversationParticipant.findAll(
      { conversation_id: { $in: cids } },
      ["user_id"],
      null
    );

    const ids = participantIds.map((p) => p.user_id);
    const usersLogin = await User.findAll(
      {
        _id: { $in: ids },
      },
      ["_id", "login"],
      null
    );

    return {
      response: { id: requestId, users: usersLogin },
    };
  }
}

export default new ConversationsController();
