export const ERROR_STATUES = {
  // Default -->
  UNAUTHORIZED: { status: 404, message: "Unauthorized." },
  FORBIDDEN: { status: 403, message: "Forbidden." },
  BAD_REQUEST: { status: 400, message: "Bad Request." },
  INVALID_DATA_FORMAT: {
    status: 400,
    message: "Bad request - invalid data format",
  },
  INCORRECT_TYPE: {
    status: 422,
    message: "The type you entered is incorrect.",
  },
  INCORRECT_TOKEN: { status: 422, message: "Incorrect token." },
  TOKEN_EXPIRED: { status: 422, message: "The token has expired." },
  // Users -->
  USER_ID_MISSED: { status: 422, message: "User ID missed." },
  USER_NOT_FOUND: {
    status: 422,
    message: `We couldn't find the specified user.`,
  },
  USER_LOGIN_OR_PASS: {
    status: 422,
    message: `The 'login' or 'password' field is missing.`,
  },
  USER_SELECTED: { status: 422, message: "Please select at least one user." },
  USER_ALREADY_EXISTS: {
    status: 422,
    message: "The provided data is already associated with an existing user account.",
  },
  TOO_MANY_USERS_IN_PRIVATE: {
    status: 422,
    message: "There are too many users in the private conversation.",
  },
  TOO_MANY_USERS_IN_GROUP: {
    status: 422,
    message: "There are too many users in the group conversation.",
  },
  INCORRECT_USER: { status: 422, message: "The specified user is incorrect." },
  INCORRECT_PASSWORD: {
    status: 422,
    message: "The password entered is incorrect.",
  },
  INCORRECT_LOGIN: { status: 422, message: "The login provided is incorrect." },
  INCORRECT_CURRENT_PASSWORD: {
    status: 422,
    message: "The current password you entered is incorrect.",
  },
  INCORRECT_LOGIN_OR_PASSWORD: {
    status: 422,
    message: "Incorrect username or password.",
  },
  DEVICE_ID_MISSED: { status: 422, message: `'device_id' is required.` },
  // Contacts -->
  CONTACT_NOT_FOUND: { status: 422, message: "Contact not found." },
  CONTACT_ID_MISSED: { status: 422, message: "Contact id is missed." },
  FULLNAME_IS_MISSED: {
    status: 422,
    message: `'first_name' or 'last_name' is missed.`,
  },
  EMAIL_OR_PHONE_IS_MISSED: {
    status: 422,
    message: "Email or phone is missed.",
  },
  // Conversation -->
  CONVERSATION_NOT_FOUND: { status: 404, message: "Conversation not found." },
  CONVERSATION_EXISTS: { status: 404, message: "Conversation exists." },
  CONVERSATION_NAME_MISSED: {
    status: 422,
    message: `You haven't specified a conversation name.`,
  },
  CONVERSATION_TYPE_MISSED: {
    status: 422,
    message: "Conversation type missed.",
  },
  PARTICIPANTS_NOT_PROVIDED: {
    status: 422,
    message: "Participants not provided.",
  },
  PARTICIPANT_NOT_FOUND: {
    status: 404,
    message: "ConversationParticipant not found.",
  },
  PARTICIPANTS_LIMIT: {
    status: 422,
    message: `You've reached the maximum participant limit.`,
  },
  OPPONENT_NOT_FOUND: { status: 422, message: "Opponent ID not found." },
  // File -->
  FILE_IDS_MISSED: { status: 422, message: "File IDS missed." },
  FILE_LIMIT_EXCEEDED: {
    status: 422,
    message: `You've exceeded the file limit.`,
  },
  FILE_IDS_EXCEEDED: {
    status: 422,
    message: "File IDs for get download url exceeded.",
  },
  INCORRECT_FILE_NAME: { status: 422, message: "Incorrect file name." },
  INCORRECT_FILE_SIZE: { status: 422, message: "Incorrect file size." },
  INCORRECT_CONTENT_TYPE: {
    status: 422,
    message: "Incorrect content type.",
  },
  // Message -->
  MESSAGE_ID_NOT_FOUND: { status: 422, message: "Message ID not found." },
  MESSAGE_ID_MISSED: { status: 422, message: "Message ID missed." },
  INCORRECT_MESSAGE_ID: { status: 422, message: "Incorrect message ID." },
  MESSAGE_TYPE_MISSED: { status: 422, message: "Message type missed." },
  MESSAGE_BODY_AND_ATTACHMENTS_EMPTY: {
    status: 422,
    message: "Either message body or attachments required.",
  },
  USER_BLOCKED: {
    status: 422,
    message: "Communication is not possible - you are in a block list of the recipient.",
  },
  // Status -->
  STATUS_ID_MISSED: { status: 422, message: "Status ID missed." },
  STATUS_TYPE_MISSED: { status: 422, message: "Status type missed." },
  STATUS_T_MISSED: { status: 422, message: `Status 't' missed.` },
  // Push Notification -->
  INCORRECT_PLATFROM_TYPE: { status: 422, message: "Incorrect platform type." },
  INCORRECT_DEVICE_ID: { status: 422, message: "Incorrect device id." },
  INCORRECT_RECIPIENTS_IDS: {
    status: 422,
    message: "Incorrect recipients IDs.",
  },
  RECIPIENTS_NOT_FOUND: { status: 422, message: "Recipients not found." },
  NOTIFICATION_MESSAGE_MISSED: {
    status: 422,
    message: "Notification message missed.",
  },
  NOTIFICATION_NOT_FOUND: {
    status: 422,
    message: "Push notification record not found.",
  },
  INCORRECT_KEYS: { status: 422, message: "Incorrect keys." },
  // Other -->
  LOG_TIMETAMP_MISSED: { status: 422, message: "Gt or lt query missed." },
  CID_REQUIRED: {
    status: 422,
    message: `'cid' field is required.`,
  },
  CIDS_REQUIRED: {
    status: 422,
    message: `'cids' field is required.`,
  },
}

export const requiredError = (field) => {
  const text = `${field} field is required.`

  return new Error(text, { cause: { status: 422, message: text } })
}
