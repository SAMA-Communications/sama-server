export const ERROR_STATUES = {
  // Default -->
  UNAUTHORIZED: { status: 404, message: "Unauthorized" },
  FORBIDDEN: { status: 403, message: "Forbidden" },
  BAD_REQUEST: { status: 400, message: "Bad Request" },
  INCORRECT_TYPE: {
    status: 422,
    message: "Incorrect type",
  },
  // Users -->
  USER_MISSED: { status: 422, message: "User already exists" },
  USER_SELECTED: { status: 422, message: "Select at least one user" },
  TOO_MANY_USERS: {
    status: 422,
    message: "Too many users in private conversation",
  },
  // Conversation -->
  CONVERSATION_NOT_FOUND: { status: 404, message: "Conversation not found" },
  CONVERSATION_NAME_MISSED: {
    status: 422,
    message: "No conversation name specified",
  },
  PARTICIPANT_NOT_FOUND: {
    status: 404,
    message: "ConversationParticipant not found",
  },
  RECIPIENT_NOT_FOUND: { status: 422, message: "Recipient not found" },
  // Message -->
  MESSAGE_PARTICIPANT_NOT_FOUND: {
    status: 403,
    message: "Participant not found",
  },
  MESSAGE_ID_NOT_FOUND: { status: 422, message: "Message ID not found" },
  MESSAGE_ID_MISSED: { status: 422, message: "Message ID missed" },
  BODY_IS_EMPTY: { status: 422, message: "Body of message is empty" },
  // Other -->
  EITHER_TO_OR_CID_REQUIRED: {
    status: 422,
    message: "Either 'to' or 'cid' field is required",
  },
};
