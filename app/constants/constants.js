export const CONSTANTS = {
  LOGGER_BINDINGS_NAMES: {
    SERVER_REQUEST_ID: "srId",
    REQUEST_ID: "rId",
    CLIENT_ID: "cId",
    PROTOCOL_TYPE: "pType",
    REQUEST_START_TIME: "rStartTime",
    NO_REQUEST_ID: "no-id",
  },
  DAY_IN_MS: 86400000,
  WEEK_IN_MS: 604800000,
  LAST_ACTIVITY_STATUS: {
    ONLINE: "online",
    OFFLINE: "offline",
  },
  SESSION_NODE_KEY: "NODE_ENDPOINT",
  SESSION_INACTIVE_STATE_KEY: "MOBILE_INACTIVE",
  SESSION_DEVICE_ID_KEY: "DEVICE_ID",
  HTTP_DEVICE_ID: "SAMA_HTTP_CLIENT_DEVICE_ID",
  HTTP_ADMIN_API_KEY_HEADER: "admin-api-key",
  HTTP_REPL_ACCESS_KEY_HEADER: "repl-access-key",
  CHAT_SUMMARY_FILTERS: {
    LAST_7_DAYS: "last-7-days",
    LAST_DAY: "last-day",
    UNREADS: "unreads",
  },
  SUMMARY_AI_PROMPT: `You are a helpful assistant. Please provide a concise summary of the following chat messages in en. Use bullet points or a short paragraph. Focus on meaningful conversation and skip system messages or irrelevant technical info. Each line is a message from a participant. If a message includes attachments (serialized as JSON), try to understand what they are and include relevant info in the summary — for example, if it contains an image, video, or file name. Messages: `,
  SUMMARY_AI_DEFAULT_RETURN_MESSAGE: "There are no messages to process in this chat.",
  MESSAGE_TONE_AI_PROMPT:
    "Use its original language, or en if unclear. Avoid using italicized emotional interjections. Instead, express the same emotions directly using plain text or appropriate emojis. Keep all meaning. Output only the rewritten text.",
  MESSAGE_TONE: {
    POSITIVE: "positive",
    NEGATIVE: "negative",
    CRINGE: "cringe",
  },
  ENVS: {
    DEV: "development",
    PROD: "production",
    LOCAL: "local",
    TESTING: "testing",
  },
  ENV_TRUE: "true",
  REDIS_PREFIXES: {
    NODE_DATA: "sama-node-data",
    NODE_USERS: "sama-node-users",
    USER_DEVICES: "sama-user-devices",
    USER_DATA: "sama-user-data",
  },
}
