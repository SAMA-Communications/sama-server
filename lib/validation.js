import Conversation from "../models/conversation.js";
import ConversationParticipant from "../models/conversation_participant.js";
import Messages from "../models/message.js";
import User from "../models/user.js";
import { CONSTANTS } from "../constants/constants.js";
import { ERROR_STATUES } from "../constants/http_constants.js";
import { ObjectId } from "mongodb";
import { getSessionUserId } from "../models/active.js";

function validateIsUserAccess(vParams, ws) {
  if (getSessionUserId(ws) != vParams.from.toString()) {
    throw new Error(ERROR_STATUES.FORBIDDEN.message, {
      cause: ERROR_STATUES.FORBIDDEN,
    });
  }
}
function validateUserSession(vParam, ws) {
  if (!getSessionUserId(ws)) {
    throw new Error(ERROR_STATUES.UNAUTHORIZED.message, {
      cause: ERROR_STATUES.UNAUTHORIZED,
    });
  }
}
function validateTOorCID(vParams) {
  if (!vParams.to && !vParams.cid) {
    throw new Error(ERROR_STATUES.EITHER_TO_OR_CID_REQUIRED.message, {
      cause: ERROR_STATUES.EITHER_TO_OR_CID_REQUIRED,
    });
  }
}
function validateDeviceId(vParams) {
  if (!vParams.deviceId) {
    throw new Error(ERROR_STATUES.DEVICE_ID_MISSED.message, {
      cause: ERROR_STATUES.DEVICE_ID_MISSED,
    });
  }
}
//  Conversation -->>>
function validateConversationType(vParams) {
  if (!vParams.type) {
    throw new Error(ERROR_STATUES.CONVERSATION_TYPE_MISSED.message, {
      cause: ERROR_STATUES.CONVERSATION_TYPE_MISSED,
    });
  }
  if (!CONSTANTS.CONVERSATION_TYPES.includes(vParams.type)) {
    throw new Error(ERROR_STATUES.INCORRECT_TYPE.message, {
      cause: ERROR_STATUES.INCORRECT_TYPE,
    });
  }
}
function validateParticipants(vParams) {
  if (!vParams.participants || vParams.participants.length === 0) {
    throw new Error(ERROR_STATUES.USER_SELECTED.message, {
      cause: ERROR_STATUES.USER_SELECTED,
    });
  }
}
function validateConversationName(vParams) {
  if (!vParams.name) {
    throw new Error(ERROR_STATUES.CONVERSATION_NAME_MISSED.message, {
      cause: ERROR_STATUES.CONVERSATION_NAME_MISSED,
    });
  }
}
function validateConversationisUserOwner(vParams, ws) {
  if (vParams.owner_id.toString() !== getSessionUserId(ws)) {
    throw new Error(ERROR_STATUES.FORBIDDEN.message, {
      cause: ERROR_STATUES.FORBIDDEN,
    });
  }
}
async function validateIsConversation(vParams) {
  const conversation = await Conversation.findOne({ _id: vParams.id });
  if (!vParams.id || !conversation) {
    throw new Error(ERROR_STATUES.BAD_REQUEST.message, {
      cause: ERROR_STATUES.BAD_REQUEST,
    });
  }
}
function validateParticipantsLimit(vParams) {
  if (vParams >= process.env.CONVERSATION_MAX_PARTICIPANTS) {
    throw new Error(ERROR_STATUES.PARTICIPANTS_LIMIT.message, {
      cause: ERROR_STATUES.PARTICIPANTS_LIMIT,
    });
  }
}
async function validateParticipantsInUType(vParams) {
  if (vParams.participants.length >= 3) {
    throw new Error(ERROR_STATUES.TOO_MANY_USERS.message, {
      cause: ERROR_STATUES.TOO_MANY_USERS,
    });
  }
  if (!vParams.recipient && !(await User.findOne({ _id: vParams.recipient }))) {
    throw new Error(ERROR_STATUES.RECIPIENT_NOT_FOUND.message, {
      cause: ERROR_STATUES.RECIPIENT_NOT_FOUND,
    });
  }
}
async function validateIsConversationByCID(vParams, ws) {
  const conversation = await Conversation.findOne({
    _id: vParams.cid,
  });
  if (conversation) {
    const participant = await ConversationParticipant.findOne({
      conversation_id: conversation.params._id,
      user_id: getSessionUserId(ws),
    });
    if (!participant) {
      throw new Error(ERROR_STATUES.FORBIDDEN.message, {
        cause: ERROR_STATUES.FORBIDDEN,
      });
    }
  } else {
    throw new Error(ERROR_STATUES.CONVERSATION_NOT_FOUND.message, {
      cause: ERROR_STATUES.CONVERSATION_NOT_FOUND,
    });
  }
}
async function validateIsUserSendHimSelf(vParams, ws) {
  if (vParams.recipient.toString() == getSessionUserId(ws)) {
    throw new Error(ERROR_STATUES.INCORRECT_USER.message, {
      cause: ERROR_STATUES.INCORRECT_USER,
    });
  }
}
async function validateIsConversationByTO(vParams, ws) {
  const conversation = await Conversation.findOne({
    $or: [
      {
        type: "u",
        owner_id: ObjectId(getSessionUserId(ws)),
        recipient: vParams.to.toString(),
      },
      {
        type: "u",
        owner_id: ObjectId(vParams.to),
        recipient: getSessionUserId(ws),
      },
    ],
  });
  if (conversation) {
    const participant = await ConversationParticipant.findOne({
      conversation_id: conversation.params._id,
      user_id: getSessionUserId(ws),
    });
    if (!participant) {
      throw new Error(ERROR_STATUES.FORBIDDEN.message, {
        cause: ERROR_STATUES.FORBIDDEN,
      });
    }
  } else {
    throw new Error(ERROR_STATUES.CONVERSATION_NOT_FOUND.message, {
      cause: ERROR_STATUES.CONVERSATION_NOT_FOUND,
    });
  }
}
//  Messages -->>>
function validateMessageId(vParams) {
  if (!vParams.id || vParams.id.length == 0) {
    throw new Error(ERROR_STATUES.MESSAGE_ID_MISSED.message, {
      cause: ERROR_STATUES.MESSAGE_ID_MISSED,
    });
  }
}
function validateMessageBody(vParams) {
  if (!vParams.body) {
    throw new Error(ERROR_STATUES.BODY_IS_EMPTY.message, {
      cause: ERROR_STATUES.BODY_IS_EMPTY,
    });
  }
}
async function validateIsMessageById(vParams) {
  if (!vParams.mid) {
    throw new Error(ERROR_STATUES.MESSAGE_ID_MISSED.message, {
      cause: ERROR_STATUES.MESSAGE_ID_MISSED,
    });
  }

  if (!(await Messages.findOne({ id: vParams.mid }))) {
    throw new Error(ERROR_STATUES.MESSAGE_ID_NOT_FOUND.message, {
      cause: ERROR_STATUES.MESSAGE_ID_NOT_FOUND,
    });
  }
}
function validateMessageDeleteType(vParams) {
  if (!vParams.type) {
    throw new Error(ERROR_STATUES.MESSAGE_TYPE_MISSED.message, {
      cause: ERROR_STATUES.MESSAGE_TYPE_MISSED,
    });
  }
  if (!CONSTANTS.MESSADEGE_DELETE_TYPES.includes(vParams.type)) {
    throw new Error(ERROR_STATUES.INCORRECT_TYPE.message, {
      cause: ERROR_STATUES.INCORRECT_TYPE,
    });
  }
}
//  Status -->>>
function validateStatusId(vParams) {
  if (!vParams.id) {
    throw new Error(ERROR_STATUES.STATUS_ID_MISSED.message, {
      cause: ERROR_STATUES.STATUS_ID_MISSED,
    });
  }
}
function validateStatusConversationType(vParams) {
  if (!vParams.type) {
    throw new Error(ERROR_STATUES.STATUS_TYPE_MISSED.message, {
      cause: ERROR_STATUES.STATUS_TYPE_MISSED,
    });
  }
  if (!CONSTANTS.TYPING_TYPES.includes(vParams.type)) {
    throw new Error(ERROR_STATUES.INCORRECT_TYPE.message, {
      cause: ERROR_STATUES.INCORRECT_TYPE,
    });
  }
}

export {
  validateConversationName,
  validateConversationType,
  validateConversationisUserOwner,
  validateIsConversation,
  validateIsConversationByCID,
  validateIsConversationByTO,
  validateIsMessageById,
  validateIsUserAccess,
  validateMessageBody,
  validateMessageDeleteType,
  validateMessageId,
  validateParticipants,
  validateParticipantsInUType,
  validateParticipantsLimit,
  validateStatusConversationType,
  validateStatusId,
  validateTOorCID,
  validateUserSession,
  validateIsUserSendHimSelf,
  validateDeviceId,
};

export default async function validate(ws, vParams, functionsValidate) {
  for (let fValidate of functionsValidate) {
    await fValidate(vParams, ws);
  }
}
