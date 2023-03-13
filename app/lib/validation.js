import Conversation from "../models/conversation.js";
import ConversationParticipant from "../models/conversation_participant.js";
import SessionRepository from "../repositories/session_repository.js";
import User from "../models/user.js";
import { ACTIVE } from "../store/session.js";
import { ERROR_STATUES } from "../validations/constants/errors.js";

const sessionRepository = new SessionRepository(ACTIVE);

function validateIsUserAccess(vParams, ws) {
  if (sessionRepository.getSessionUserId(ws) != vParams.from.toString()) {
    throw new Error(ERROR_STATUES.FORBIDDEN.message, {
      cause: ERROR_STATUES.FORBIDDEN,
    });
  }
}

function validateConversationisUserOwner(vParams, ws) {
  if (vParams.owner_id.toString() !== sessionRepository.getSessionUserId(ws)) {
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
  if (
    !vParams.opponent_id &&
    !(await User.findOne({ _id: vParams.opponent_id }))
  ) {
    throw new Error(ERROR_STATUES.OPPONENT_NOT_FOUND.message, {
      cause: ERROR_STATUES.OPPONENT_NOT_FOUND,
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
      user_id: sessionRepository.getSessionUserId(ws),
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
  if (
    vParams.opponent_id.toString() == sessionRepository.getSessionUserId(ws)
  ) {
    throw new Error(ERROR_STATUES.INCORRECT_USER.message, {
      cause: ERROR_STATUES.INCORRECT_USER,
    });
  }
}

export {
  validateConversationisUserOwner,
  validateIsConversation,
  validateIsConversationByCID,
  validateIsUserAccess,
  validateIsUserSendHimSelf,
  validateParticipantsInUType,
  validateParticipantsLimit,
};

export default async function validate(ws, vParams, functionsValidate) {
  for (let fValidate of functionsValidate) {
    await fValidate(vParams, ws);
  }
}
