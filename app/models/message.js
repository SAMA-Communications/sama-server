import BaseModel from "./base.js"

export default class Message extends BaseModel {
  static get collection() {
    return "messages"
  }

  static get visibleFields() {
    return [
      "_id",
      "organization_id",
      "cid",

      "t",
      "from",
      "body",
      "x",
      "attachments",

      "created_at",

      "status", // virtual
      "reactions", // virtual
    ]
  }

  static get allowedAttachmentFields() {
    return ["file_id", "file_name", "file_url", "file_blur_hash", "file_content_type", "file_size", "file_width", "file_height"]
  }

  static get allowedBotAttachmentFields() {
    return ["file_url", "file_blur_hash", "file_content_type", "file_size", "file_width", "file_height"]
  }

  static get hiddenFields() {
    return ["updated_at"]
  }
}
