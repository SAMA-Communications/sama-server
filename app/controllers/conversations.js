import BaseController from "./base/base.js";
import Conversation from "../models/conversation.js";
import ConversationParticipant from "../models/conversation_participant.js";
import ConversationRepository from "../repositories/conversation_repository.js";
import Message from "../models/message.js";
import SessionRepository from "../repositories/session_repository.js";
import User from "../models/user.js";
import getDisplayName from "../utils/get_display_name.js";
import validate, {
  validateConversationisUserOwner,
  validateIsConversation,
  validateIsUserSendHimSelf,
  validateParticipantsInUType,
  validateParticipantsLimit,
} from "../lib/validation.js";
import { ACTIVE } from "../store/session.js";
import { CONSTANTS } from "../validations/constants/constants.js";
import { ERROR_STATUES } from "../validations/constants/errors.js";
import { ObjectId } from "../lib/db.js";
import { default as PacketProcessor } from "../routes/packet_processor.js";
import { inMemoryConversations } from "../store/in_memory.js";

class ConversationsController extends BaseController {
  constructor() {
    super();
    this.conversationRepository = new ConversationRepository(
      Conversation,
      inMemoryConversations
    );
    this.sessionRepository = new SessionRepository(ACTIVE);
  }

  async #notifyAboutConversationCreate(
    ws,
    conversation,
    currentUserLogin,
    recipients
  ) {
    const push_message = {
      title: conversation.name,
      body: `${currentUserLogin} created a new conversation`,
    };

    await PacketProcessor.deliverToUserOrUsers(
      ws,
      {
        event: { conversation_created: conversation },
        push_message,
      },
      conversation._id,
      recipients
    );
  }

  async #notifyAboutConversationUpdate(
    ws,
    conversation,
    currentUserLogin,
    recipients
  ) {
    const push_message = {
      title: conversation.name,
      body: `${currentUserLogin} added you to conversation`,
    };

    await PacketProcessor.deliverToUserOrUsers(
      ws,
      {
        event: { conversation_created: conversation },
        push_message,
      },
      conversation._id,
      recipients
    );
  }

  async create(ws, data) {
    const { id: requestId, conversation_create: conversationParams } = data;
    const currentUserId = this.sessionRepository.getSessionUserId(ws);
    const currentUserLogin = (await User.findOne({ _id: currentUserId }))
      ?.params?.login;

    const participants = await User.getAllIdsBy({
      _id: { $in: conversationParams.participants },
    });
    delete conversationParams.participants;
    conversationParams.owner_id = ObjectId(currentUserId);

    if (conversationParams.type == "u") {
      const opponentId = (conversationParams.opponent_id = String(
        participants[0]
      ));
      await validate(ws, { participants, opponent_id: opponentId }, [
        validateParticipantsInUType,
        validateIsUserSendHimSelf,
      ]);

      const existingConversation = await this.conversationRepository.findOne({
        $or: [
          {
            type: "u",
            owner_id: ObjectId(currentUserId),
            opponent_id: opponentId,
          },
          {
            type: "u",
            owner_id: ObjectId(opponentId),
            opponent_id: currentUserId,
          },
        ],
      });

      if (existingConversation) {
        const existingParticipants = await ConversationParticipant.findAll({
          conversation_id: existingConversation._id,
        });
        if (existingParticipants.length !== 2) {
          const requiredParticipantsIds = [currentUserId, opponentId];
          const existingParticipantsIds = existingParticipants.map((u) =>
            u.user_id.toString()
          );

          const missedParticipantId = requiredParticipantsIds.filter(
            (uId) => !existingParticipantsIds.includes(uId)
          )[0];

          const participant = new ConversationParticipant({
            user_id: ObjectId(missedParticipantId),
            conversation_id: existingConversation._id,
          });
          await participant.save();

          await this.#notifyAboutConversationCreate(
            ws,
            existingConversation,
            currentUserLogin,
            [missedParticipantId]
          );
        }
        return {
          response: {
            id: requestId,
            conversation: existingConversation,
          },
        };
      }
    }

    const isOwnerInArray = participants.some(
      (el) => JSON.stringify(el) === JSON.stringify(conversationParams.owner_id)
    );
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

    for (const userId of participants) {
      const participant = new ConversationParticipant({
        user_id: userId,
        conversation_id: conversationObj.params._id,
      });
      await participant.save();
    }

    const convParams = conversationObj.visibleParams();
    await this.#notifyAboutConversationCreate(
      ws,
      convParams,
      currentUserLogin,
      participants
    );

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

    const currentUserId = this.sessionRepository.getSessionUserId(ws);
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

        const existingParticipantsIds = (
          await ConversationParticipant.findAll(
            {
              conversation_id: conversationId,
            },
            ["user_id"]
          )
        ).map((p) => p.user_id.toString());

        let newParticipantsIds = addUsers.filter(
          (uId) => !existingParticipantsIds.includes(uId)
        );

        let currentUserParams;
        const participantsInfo = (
          await User.findAll(
            { _id: { $in: [currentUserId, ...newParticipantsIds] } },
            [
              "login",
              "first_name",
              "last_name",
              "email",
              "phone",
              "recent_activity",
            ]
          )
        ).filter((obj) => {
          if (obj._id.toString() === currentUserId) {
            currentUserParams = obj;
            return false;
          }
          return true;
        });

        const participantSavePromises = participantsInfo.map(async (u) => {
          const participant = new ConversationParticipant({
            user_id: ObjectId(u._id),
            conversation_id: ObjectId(conversationId),
          });
          await participant.save();

          const messageInHistory = new Message({
            id: currentUserId + Date.now(),
            body: getDisplayName(u) + " has been added to the group",
            cid: new ObjectId(conversationId),
            deleted_for: [],
            from: new ObjectId(currentUserId),
            t: parseInt(Math.round(Date.now() / 1000)),
            x: { type: "added_participant", user: u },
          });
          await messageInHistory.save();

          const messageForDelivery = {
            message: messageInHistory.visibleParams(),
            push_message: {
              title: `${getDisplayName(currentUserParams)} | ${
                conversation.name
              }`,
              body: messageInHistory.params.body,
              cid: messageInHistory.params.cid,
            },
          };

          await PacketProcessor.deliverToUserOrUsers(
            ws,
            messageForDelivery,
            null,
            existingParticipantsIds
          );
          ws.send(JSON.stringify({ message: messageForDelivery.message }));
        });
        await Promise.all(participantSavePromises);

        if (newParticipantsIds.length && conversation.type !== "u") {
          const convObjectId = conversation._id;
          conversation["last_message"] = (
            await Message.getLastMessageForConversation(
              [convObjectId],
              currentUserId
            )
          )[convObjectId];
          conversation["unread_messages_count"] = 1;

          const currentUserLogin = (await User.findOne({ _id: currentUserId }))
            ?.params?.login;
          await this.#notifyAboutConversationUpdate(
            ws,
            conversation,
            currentUserLogin,
            newParticipantsIds
          );
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
    const existingUserInConversation = await ConversationParticipant.findOne({
      conversation_id: conversationId,
    });
    if (!existingUserInConversation) {
      await this.conversationRepository.delete(conversation._id);
    } else if (
      conversation.owner_id.toString() ===
        this.sessionRepository.getSessionUserId(ws) &&
      conversation.type !== "u"
    ) {
      await this.conversationRepository.updateOne(conversationId, {
        owner_id: existingUserInConversation.params.user_id,
      });
    }

    return { response: { id: requestId, success: true } };
  }

  async get_participants_by_cids(ws, data) {
    const {
      id: requestId,
      get_participants_by_cids: { cids, includes },
    } = data;

    const availableConversation = await ConversationParticipant.findAll({
      conversation_id: { $in: cids },
      user_id: this.sessionRepository.getSessionUserId(ws),
    });

    if (!availableConversation.length) {
      return { response: { id: requestId, users: [] } };
    }

    const conversations = await Conversation.findAll(
      { _id: { $in: availableConversation.map((obj) => obj.conversation_id) } },
      ["type", "opponent_id", "owner_id"],
      null
    );

    const usersIds = [];
    const convTypeGIds = [];

    conversations.forEach((conv) => {
      if (conv.type === "g") {
        convTypeGIds.push(conv._id);
        return;
      }
      usersIds.push(conv.opponent_id, conv.owner_id.toString());
    });

    if (convTypeGIds.length) {
      const participants = await ConversationParticipant.findAll(
        {
          conversation_id: { $in: convTypeGIds },
        },
        ["user_id"]
      );
      participants.forEach((u) => usersIds.push(u.user_id.toString()));
    }

    const usersLogin = await User.findAll(
      {
        _id: { $in: usersIds.filter((el, i) => usersIds.indexOf(el) === i) },
      },
      includes
        ? ["_id"]
        : ["_id", "first_name", "last_name", "login", "email", "phone"],
      null
    );

    return {
      response: { id: requestId, users: usersLogin },
    };
  }
}

export default new ConversationsController();
