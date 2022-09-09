export const ERROR_STATUES = {
  UNAUTHORIZED: { status: 404, message: "Unauthorized" },
  FORBIDDEN: { status: 403, message: "Forbidden" },
  BAD_REQUEST: { status: 400, message: "Bad Request" },
  USER_MISSED: { status: 422, message: "User already exists" },
  USER_SELECTED: { status: 422, message: "Select at least one user" },
  CONVERSATION_NOT_FOUND: { status: 404, message: "Conversation not found" },
  CONVERSATION_NAME_MISSED: {
    status: 422,
    message: "No conversation name specified",
  },
  PARTICIPANT_NOT_FOUND: {
    status: 404,
    message: "ConversationParticipant not found",
  },
};
