const AI_CURRENT_USER_POSTFIX = "::current_user"

export const CONSTANTS = {
  DAY_IN_MS: 86400000,
  WEEK_IN_MS: 604800000,
  CONVERSATION_LIMIT_MAX: +process.env.CONVERSATION_PRELOAD_COUNT,
  MESSAGE_LIMIT_MAX: +process.env.MESSAGE_PRELOAD_COUNT,
  SEARCH_LIMIT_MAX: +process.env.SEARCH_PRELOAD_COUNT,
  LAST_ACTIVITY_STATUS: {
    ONLINE: "online",
    OFFLINE: "offline",
  },
  SESSION_NODE_KEY: "NODE_ENDPOINT",
  SESSION_INACTIVE_STATE_KEY: "MOBILE_INACTIVE",
  HTTP_DEVICE_ID: "HTTP_CLIENT",
  HTTP_ADMIN_API_KEY_HEADER: "admin-api-key",

  CHAT_SUMMARY_FITLERS: {
    LAST_7_DAYS: "last-7-days",
    LAST_DAY: "last-day",
    UNREADS: "unreads",
  },
  AI_CURRENT_USER_POSTFIX,
  SUMMARY_AI_PROMPT: `You are a helpful assistant. Please provide a concise summary of the following chat messages in en. Use bullet points or a short paragraph. Focus on meaningful conversation and skip system messages or irrelevant technical info. Each line is a message from a participant. If a username ends with "${AI_CURRENT_USER_POSTFIX}", it means that message was sent by ME (the user requesting this summary). In this summary, I will address you informally, using "you" in a familiar way. If a message includes attachments (serialized as JSON), try to understand what they are and include relevant info in the summary — for example, if it contains an image, video, or file name. Messages: `,
  SUMMARY_AI_DEFAULT_RETURN_MESSAGE: "There are no messages to process in this chat.",

  MESSAGE_TONE: {
    POSITIVE: "positive",
    NEGATIVE: "negative",
    CRINGE: "cringe",
  },
}
