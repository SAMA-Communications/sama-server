import BaseController from "./base/base.js";
import Conversation from "../models/conversation.js";
import ConversationParticipant from "../models/conversation_participant.js";
import ConversationRepository from "../repositories/conversation_repository.js";
import ConversationService from "../services/conversation.js";
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
    this.conversationService = new ConversationService();
    this.sessionRepository = new SessionRepository(ACTIVE);
  }

  async #notifyAboutConversationEvent(
    eventType,
    ws,
    conversation,
    currentUserParams,
    recipients
  ) {
    const push_message = {
      title: conversation.name,
      body:
        getDisplayName(currentUserParams) +
        CONSTANTS.EVENT_TYPE_PARAMS[eventType].push_message_body,
    };

    await PacketProcessor.deliverToUserOrUsers(
      ws,
      {
        event: {
          [CONSTANTS.EVENT_TYPE_PARAMS[eventType].event_request_name]:
            conversation,
        },
        push_message,
      },
      conversation._id,
      recipients
    );
  }

  async #storeAndNotifyAboutParticipantAction(
    ws,
    conversation,
    currentUserParams,
    actionUserParams,
    usersIdsForDelivery,
    actionType
  ) {
    const messageInHistory = new Message({
      body:
        getDisplayName(actionUserParams) +
        CONSTANTS.ACTION_PARTICIPANT_MESSAGE[actionType],
      cid: conversation._id,
      deleted_for: [],
      from: currentUserParams._id,
      t: parseInt(Math.round(Date.now() / 1000)),
      x: { type: actionType, user: actionUserParams },
    });
    await messageInHistory.save();

    const messageForDelivery = {
      message: messageInHistory.visibleParams(),
      push_message: {
        title: `${getDisplayName(currentUserParams)} | ${conversation.name}`,
        body: messageInHistory.params.body,
        cid: messageInHistory.params.cid,
      },
    };

    await PacketProcessor.deliverToUserOrUsers(
      ws,
      messageForDelivery,
      null,
      usersIdsForDelivery
    );
    ws.send(JSON.stringify({ message: messageForDelivery.message }));
  }

  async create(ws, data) {
    const { id: requestId, conversation_create: conversationParams } = data;
    const currentUserId = this.sessionRepository.getSessionUserId(ws);
    const currentUserParams = (await User.findOne({ _id: currentUserId }))
      ?.params;

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

          await this.#notifyAboutConversationEvent(
            CONSTANTS.CONVERSATION_EVENT.CREATE,
            ws,
            existingConversation,
            currentUserParams,
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
    await this.#notifyAboutConversationEvent(
      CONSTANTS.CONVERSATION_EVENT.CREATE,
      ws,
      convParams,
      currentUserParams,
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
      conversation.type !== "u" &&
      requestData.participants &&
      Object.keys(requestData.participants) != 0
    ) {
      const participantsToUpdate = requestData.participants;
      delete requestData.participants;

      const { add: addUsers, remove: removeUsers } = participantsToUpdate;
      const countParticipants = await ConversationParticipant.count({
        conversation_id: conversationId,
      });

      const currentUserParams = (await User.findOne({ _id: currentUserId }))
        ?.params;

      let existingParticipantsIds = (
        await ConversationParticipant.findAll(
          { conversation_id: conversationId },
          ["user_id"]
        )
      ).map((p) => p.user_id.toString());

      const { newParticipantsIds, newParticipantsInfo } = addUsers?.length
        ? await this.conversationService.getNewParticipantsParams(
            existingParticipantsIds,
            addUsers
          )
        : {};

      const { removeParticipantsIds, removeParticipantsInfo } =
        removeUsers?.length
          ? await this.conversationService.getRemoveParticipantsParams(
              existingParticipantsIds,
              removeUsers
            )
          : {};

      if (addUsers && newParticipantsIds.length) {
        await validate(ws, countParticipants + addUsers.length, [
          validateParticipantsLimit,
        ]);

        const participantSavePromises = newParticipantsInfo.map(async (u) => {
          const participant = new ConversationParticipant({
            user_id: ObjectId(u._id),
            conversation_id: ObjectId(conversationId),
          });
          await participant.save();

          this.#storeAndNotifyAboutParticipantAction(
            ws,
            conversation,
            currentUserParams,
            u,
            existingParticipantsIds,
            "added_participant"
          );
        });
        await Promise.all(participantSavePromises);

        const convObjectId = conversation._id;
        conversation["last_message"] = (
          await Message.getLastMessageForConversation(
            [convObjectId],
            currentUserId
          )
        )[convObjectId];
        conversation["unread_messages_count"] = 1;

        await this.#notifyAboutConversationEvent(
          CONSTANTS.CONVERSATION_EVENT.UPDATE,
          ws,
          conversation,
          currentUserParams,
          newParticipantsIds
        );
      }

      if (removeUsers && removeParticipantsIds.length) {
        const participantRemovePromises = removeParticipantsInfo.map(
          async (u) => {
            const uStringId = u._id.toString();
            isOwnerChange = conversation.owner_id.toString() === uStringId;

            const participantObj = await ConversationParticipant.findOne({
              user_id: u._id,
              conversation_id: conversationId,
            });
            await participantObj.delete();

            existingParticipantsIds = existingParticipantsIds.filter(
              (uId) => uId !== uStringId
            );

            this.#storeAndNotifyAboutParticipantAction(
              ws,
              conversation,
              currentUserParams,
              u,
              existingParticipantsIds,
              "removed_participant"
            );
          }
        );
        await Promise.all(participantRemovePromises);

        await this.#notifyAboutConversationEvent(
          CONSTANTS.CONVERSATION_EVENT.DELETE,
          ws,
          conversation,
          currentUserParams,
          removeParticipantsIds
        );
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
