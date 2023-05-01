export const ERROR_STATUES = {
  // Default -->
  UNAUTHORIZED: { status: 404, message: "Unauthorized" },
  FORBIDDEN: { status: 403, message: "Forbidden" },
  BAD_REQUEST: { status: 400, message: "Bad Request" },
  INCORRECT_TYPE: { status: 422, message: "Incorrect type" },
  INCORRECT_TOKEN: { status: 422, message: "Incorrect token" },
  TOKEN_EXPIRED: { status: 422, message: "Token expired" },
  // Users -->
  USER_ID_MISSED: { status: 422, message: "User ID missed" },
  USER_NOT_FOUND: { status: 422, message: "User not found" },
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
  INCORRECT_PASSWORD: { status: 422, message: "Incorrect password" },
  INCORRECT_LOGIN: { status: 422, message: "Incorrect login" },
  INCORRECT_CURRENT_PASSWORD: {
    status: 422,
    message: "Incorrect current password",
  },
  DEVICE_ID_MISSED: { status: 422, message: "'deviceId' is required" },
  // Contacts -->
  CONTACT_NOT_FOUND: { status: 422, message: "Contact not found" },
  CONTACT_ID_MISSED: { status: 422, message: "Contact id is missed" },
  FULLNAME_IS_MISSED: {
    status: 422,
    message: "'first_name' or 'last_name' is missed",
  },
  EMAIL_OR_PHONE_IS_MISSED: {
    status: 422,
    message: "Email or phone is missed",
  },
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
  // File -->
  FILE_IDS_MISSED: { status: 422, message: "File IDS missed" },
  FILE_LIMIT_EXCEEDED: { status: 422, message: "File limit exceded" },
  FILE_IDS_EXCEEDED: {
    status: 422,
    message: "File ids for get download url exceeded",
  },
  FILE_NAME_MISSED: { status: 422, message: "File name missed" },
  FILE_SIZE_MISSED: { status: 422, message: "File size missed" },
  FILE_CONTENT_TYPE_MISSED: {
    status: 422,
    message: "File content type missed",
  },
  // Message -->
  MESSAGE_ID_NOT_FOUND: { status: 422, message: "Message ID not found" },
  MESSAGE_ID_MISSED: { status: 422, message: "Message ID missed" },
  MESSAGE_TYPE_MISSED: { status: 422, message: "Message Type missed" },
  MESSAGE_BODY_AND_ATTACHMENTS_EMPTY: {
    status: 422,
    message: "Either message body or attachments required",
  },
  USER_BLOCKED: {
    status: 422,
    message:
      "Communication is not possible - you are in a block list of the recipient",
  },
  USER_BLOCKED_FOR_ALL_PARTICIPANTS: {
    status: 422,
    message:
      "Communication is not possible - you are in a block list of all the recipients",
  },
  // Status -->
  STATUS_ID_MISSED: { status: 422, message: "Status ID missed" },
  STATUS_TYPE_MISSED: { status: 422, message: "Status Type missed" },
  STATUS_T_MISSED: { status: 422, message: "Status 't' missed" },
  // Push Notification -->
  INCORRECT_PLATFROM_TYPE: { status: 422, message: "Incorrect platform type" },
  INCORRECT_DEVICE_ID: { status: 422, message: "Incorrect deviceId" },
  INCORRECT_RECIPIENTS_IDS: {
    status: 422,
    message: "Incorrect recipients ids",
  },
  RECIPIENTS_NOT_FOUND: { status: 422, message: "Recipients not found" },
  NOTIFICATION_MESSAGE_MISSED: {
    status: 422,
    message: "Notification message missed",
  },
  NOTIFICATION_NOT_FOUND: {
    status: 422,
    message: "Push notification record not found",
  },
  INCORRECT_KEYS: { status: 422, message: "Incorrect keys" },
  // Other -->
  LOG_TIMETAMP_MISSED: { status: 422, message: "Gt or lt query missed" },
  CID_REQUIRED: {
    status: 422,
    message: "'cid' field is required",
  },
};
