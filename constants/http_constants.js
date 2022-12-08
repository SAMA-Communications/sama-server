export const ERROR_STATUES = {
  // Default -->
  UNAUTHORIZED: { status: 404, message: "Unauthorized" },
  FORBIDDEN: { status: 403, message: "Forbidden" },
  BAD_REQUEST: { status: 400, message: "Bad Request" },
  INCORRECT_TYPE: { status: 422, message: "Incorrect type" },
  TOKEN_EXPIRED: { status: 422, message: "Token has expired" },
  // Users -->
  USER_MISSED: { status: 422, message: "User already exists" },
  USER_ID_MISSED: { status: 422, message: "User ID missed" },
  USER_LOGIN_OR_PASS: {
    status: 422,
    message: "User 'login' or 'password' field missed",
  },
  USER_SELECTED: { status: 422, message: "Select at least one user" },
  USER_ALREADY_EXISTS: { status: 422, message: "User already exists" },
  TOO_MANY_USERS: {
    status: 422,
    message: "Too many users in private conversation",
  },
  INCORRECT_USER: { status: 422, message: "Incorrect user" },
  INCORRECT_CURRENT_PASSWORD: {
    status: 422,
    message: "Incorrect current password",
  },
  DEVICE_ID_MISSED: { status: 422, message: "'deviceId' is required" },
  // Conversation -->
  CONVERSATION_NOT_FOUND: { status: 404, message: "Conversation not found" },
  CONVERSATION_NAME_MISSED: {
    status: 422,
    message: "No conversation name specified",
  },
  CONVERSATION_TYPE_MISSED: {
    status: 422,
    message: "Conversation Type missed",
  },
  PARTICIPANTS_NOT_PROVIDED: {
    status: 422,
    message: "Participants not provided",
  },
  PARTICIPANT_NOT_FOUND: {
    status: 404,
    message: "ConversationParticipant not found",
  },
  PARTICIPANTS_LIMIT: {
    status: 422,
    message: "Max participants limit reached",
  },
  OPPONENT_NOT_FOUND: { status: 422, message: "Opponent Id not found" },
  // Message -->
  MESSAGE_PARTICIPANT_NOT_FOUND: {
    status: 403,
    message: "Participant not found",
  },
  MESSAGE_ID_NOT_FOUND: { status: 422, message: "Message ID not found" },
  MESSAGE_ID_MISSED: { status: 422, message: "Message ID missed" },
  MESSAGE_TYPE_MISSED: { status: 422, message: "Message Type missed" },
  BODY_IS_EMPTY: { status: 422, message: "Body of message is empty" },
  // Status -->
  STATUS_ID_MISSED: { status: 422, message: "Status ID missed" },
  STATUS_TYPE_MISSED: { status: 422, message: "Status Type missed" },
  // Other -->
  CID_REQUIRED: {
    status: 422,
    message: "'cid' field is required",
  },
};
