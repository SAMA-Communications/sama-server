import { slice } from "../utils/req_res_utils.js";
import { ObjectId } from "mongodb";
import { CONSTANTS } from "../constants/constants.js";
import { ALLOW_FIELDS } from "../constants/fields_constants.js";
import { ERROR_STATUES } from "../constants/http_constants.js";
import User from "../models/user.js";
import ACTIVE from "../models/active.js";
import Conversation from "../models/conversation.js";
import ConversationParticipant from "../models/conversation_participant.js";

export default class ConversationController {
  async create(ws, data) {
    const requestId = data.request.id;

    const participantsParams = slice(
      data.request.conversation_create,
      ALLOW_FIELDS.ALLOWED_FIELDS_PARTICIPANTS_CREATE
    );
    participantsParams.participants = await User.getAllIdsBy({
      _id: { $in: participantsParams.participants },
    });

    const conversationParams = slice(
      data.request.conversation_create,
      ALLOW_FIELDS.ALLOWED_FIELDS_CONVERSATION_CREATE
    );

    if (!CONSTANTS.CONVERSATION_TYPES.includes(conversationParams.type)) {
      return {
        response: {
          id: requestId,
          error: ERROR_STATUES.INCORRECT_TYPE,
        },
      };
    }

    if (
      !participantsParams.participants ||
      participantsParams.participants.length === 0
    ) {
      return {
        response: {
          id: requestId,
          error: ERROR_STATUES.USER_SELECTED,
        },
      };
    }

    if (conversationParams.type == "u") {
      if (participantsParams.participants.length >= 3) {
        return {
          response: {
            id: requestId,
            error: ERROR_STATUES.TOO_MANY_USERS,
          },
        };
      }
      if (!conversationParams.recipient) {
        return {
          response: {
            id: requestId,
            error: ERROR_STATUES.RECIPIENT_NOT_FOUND,
          },
        };
      }
    }

    if (!conversationParams.name && conversationParams.type == "g") {
      return {
        response: {
          id: requestId,
          error: ERROR_STATUES.CONVERSATION_NAME_MISSED,
        },
      };
    }
    conversationParams.owner_id = ACTIVE.SESSIONS[ws].userSession.user_id;

    let isOwnerInArray = false;
    participantsParams.participants.forEach((el) => {
      if (JSON.stringify(el) === JSON.stringify(conversationParams.owner_id)) {
        isOwnerInArray = true;
        return;
      }
    });
    if (!isOwnerInArray) {
      if (conversationParams.owner_id) {
        participantsParams.participants.push(
          ObjectId(conversationParams.owner_id.toString())
        );
      } else {
        return;
      }
    } else {
      if (participantsParams.participants.length === 1) {
        return {
          response: {
            id: requestId,
            error: ERROR_STATUES.USER_SELECTED,
          },
        };
      }
    }

    const conversationObj = new Conversation(conversationParams);
    await conversationObj.save();

    participantsParams.participants.forEach(async (user) => {
      const participantObj = new ConversationParticipant({
        user_id: user,
        conversation_id: conversationObj.params._id,
      });
      await participantObj.save();
    });

    return {
      response: {
        id: requestId,
        conversation: conversationObj,
      },
    };
  }

  async update(ws, data) {
    const requestId = data.request.id;
    const requestData = data.request.conversation_update;

    const conversation = await Conversation.findOne({ _id: requestData });
    if (!requestData.id || !conversation) {
      return {
        response: {
          id: requestId,
          error: ERROR_STATUES.BAD_REQUEST,
        },
      };
    }

    if (
      conversation.params.owner_id.toString() !==
      ACTIVE.SESSIONS[ws].userSession.user_id.toString()
    ) {
      return {
        response: {
          id: requestId,
          error: ERROR_STATUES.FORBIDDEN,
        },
      };
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
      await Conversation.updateOne(
        { _id: conversationId },
        { $set: requestData }
      );
    }

    const returnConversation = await Conversation.findOne({
      _id: conversationId,
    });
    return {
      response: {
        id: requestId,
        conversation: returnConversation,
      },
    };
  }

  async list(ws, data) {
    const requestId = data.request.id;

    const currentUser = ACTIVE.SESSIONS[ws].userSession.user_id;
    const limit =
      data.request.conversation_list.limit > CONSTANTS.LIMIT_MAX
        ? CONSTANTS.LIMIT_MAX
        : data.request.conversation_list.limit || CONSTANTS.LIMIT_MAX;
    const userConversationsId = await ConversationParticipant.findAll(
      {
        user_id: currentUser,
      },
      "conversation_id"
    );

    const query = {
      _id: {
        $in: userConversationsId,
      },
    };
    const timeFromUpdate = data.request.conversation_list.updated_at;
    if (timeFromUpdate) {
      query.updated_at = { $gt: new Date(timeFromUpdate.gt) };
    }
    const userConversations = await Conversation.findAll(query, null, limit);

    return {
      response: {
        id: requestId,
        conversations: userConversations,
      },
    };
  }

  async delete(ws, data) {
    const requestId = data.request.id;

    const conversationId = data.request.conversation_delete.id;
    const conversation = await Conversation.findOne({
      _id: conversationId,
    });

    if (!conversation) {
      return {
        response: {
          id: requestId,
          error: ERROR_STATUES.CONVERSATION_NOT_FOUND,
        },
      };
    }

    const conversationParticipant = await ConversationParticipant.findOne({
      user_id: ACTIVE.SESSIONS[ws].userSession.user_id,
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
      await conversation.delete();
    } else if (
      conversation.params.owner_id.toString() ===
      ACTIVE.SESSIONS[ws].userSession.user_id.toString()
    ) {
      Conversation.updateOne(
        { _id: conversationId },
        { $set: { owner_id: isUserInConvesation.params.user_id } }
      );
    }
    return { response: { id: requestId, success: true } };
  }
}
