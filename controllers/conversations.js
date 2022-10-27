import Conversation from "../models/conversation.js";
import ConversationParticipant from "../models/conversation_participant.js";
import User from "../models/user.js";
import validate, {
  validateConversationisUserOwner,
  validateConversationName,
  validateConversationType,
  validateIsConversation,
  validateIsUserSendHimSelf,
  validateParticipants,
  validateParticipantsInUType,
  validateParticipantsLimit,
} from "../lib/validation.js";
import { ALLOW_FIELDS } from "../constants/fields_constants.js";
import { CONSTANTS } from "../constants/constants.js";
import { ERROR_STATUES } from "../constants/http_constants.js";
import { ObjectId } from "mongodb";
import { getSessionUserId } from "../models/active.js";
import { slice } from "../utils/req_res_utils.js";

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

    await validate(ws, conversationParams, [validateConversationType]);
    await validate(ws, participantsParams, [validateParticipants]);

    conversationParams.owner_id = ObjectId(getSessionUserId(ws));
    if (conversationParams.type == "u") {
      await validate(
        ws,
        {
          participants: participantsParams.participants,
          opponent_id: conversationParams.opponent_id,
        },
        [validateParticipantsInUType, validateIsUserSendHimSelf]
      );
      const existingConversation = await Conversation.findOne({
        $or: [
          {
            type: "u",
            owner_id: ObjectId(getSessionUserId(ws)),
            opponent_id: conversationParams.opponent_id,
          },
          {
            type: "u",
            owner_id: ObjectId(conversationParams.opponent_id),
            opponent_id: getSessionUserId(ws),
          },
        ],
      });
      if (existingConversation)
        return {
          response: {
            id: requestId,
            conversation: existingConversation.visibleParams(),
          },
        };
    } else if (conversationParams.type == "g") {
      await validate(ws, conversationParams, [validateConversationName]);
    }

    let isOwnerInArray = false;
    participantsParams.participants.forEach((el) => {
      if (JSON.stringify(el) === JSON.stringify(conversationParams.owner_id)) {
        isOwnerInArray = true;
        return;
      }
    });
    if (!isOwnerInArray) {
      participantsParams.participants.push(
        ObjectId(conversationParams.owner_id)
      );
    } else if (participantsParams.participants.length === 1) {
      return {
        response: {
          id: requestId,
          error: ERROR_STATUES.PARTICIPANTS_NOT_PROVIDED,
        },
      };
    }

    await validate(ws, participantsParams.participants.length, [
      validateParticipantsLimit,
    ]);

    const conversationObj = new Conversation(conversationParams);
    await conversationObj.save();

    for (let userId of participantsParams.participants) {
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
    const requestId = data.request.id;
    const requestData = data.request.conversation_update;
    await validate(ws, requestData, [validateIsConversation]);

    const conversation = await Conversation.findOne({ _id: requestData });
    await validate(ws, conversation.params, [validateConversationisUserOwner]);

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

    const currentUser = getSessionUserId(ws);
    const limit =
      data.request.conversation_list.limit > CONSTANTS.LIMIT_MAX
        ? CONSTANTS.LIMIT_MAX
        : data.request.conversation_list.limit || CONSTANTS.LIMIT_MAX;
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
    const timeFromUpdate = data.request.conversation_list.updated_at;
    if (timeFromUpdate && timeFromUpdate.gt) {
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
    await validate(ws, { id: conversationId }, [validateIsConversation]);
    const conversation = await Conversation.findOne({
      _id: conversationId,
    });

    const conversationParticipant = await ConversationParticipant.findOne({
      user_id: getSessionUserId(ws),
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
      conversation.params.owner_id.toString() === getSessionUserId(ws)
    ) {
      Conversation.updateOne(
        { _id: conversationId },
        { $set: { owner_id: isUserInConvesation.params.user_id } }
      );
    }
    return { response: { id: requestId, success: true } };
  }

  async getParticipantsByCids(ws, data) {
    const requestId = data.request.id;
    const cids = data.request.getParticipantsByCids.cids;

    let participants = {};
    for (const i in cids) {
      const participantIds = await ConversationParticipant.findAll(
        { conversation_id: cids[i] },
        ["user_id"],
        null
      );
      let ids = [];
      for (const id in participantIds) ids.push(participantIds[id].user_id);

      const usersLogin = await User.findAll(
        {
          _id: { $in: ids },
        },
        ["_id", "login"],
        null
      );
      participants[cids[i]] = usersLogin;
    }
    return {
      response: { id: requestId, participants },
    };
  }
}
