export const ALLOW_FIELDS = {
  ALLOWED_FILEDS_MESSAGE: [
    "id",
    "t",
    "to",
    "from",
    "body",
    "cid",
    "x",
    "deleted_for",
  ],
  ALLOWED_FILEDS_STATUS: ["id", "t", "type", "to", "from", "mid", "cid"],
  ALLOWED_FIELDS_USER_CREATE: ["login", "password"],
  ALLOWED_FIELDS_CONVERSATION_CREATE: [
    "name",
    "description",
    "type",
    "recipient",
  ],
  ALLOWED_FIELDS_PARTICIPANTS_CREATE: ["participants"],
};
