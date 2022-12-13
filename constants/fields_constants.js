export const ALLOW_FIELDS = {
  ALLOWED_FILEDS_MESSAGE: ["body", "cid", "x"],
  ALLOWED_FILEDS_FILE: ["name", "size", "content_type"],
  ALLOWED_FILEDS_TYPINGS: ["id", "t", "type", "cid"],
  ALLOWED_FIELDS_USER_CREATE: ["login", "password"],
  ALLOWED_FIELDS_CONVERSATION_CREATE: [
    "name",
    "description",
    "type",
    "opponent_id",
  ],
  ALLOWED_FIELDS_PARTICIPANTS_CREATE: ["participants"],
};
