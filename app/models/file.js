import BaseModel from "./base.js"

class File extends BaseModel {
  static get collection() {
    return "files"
  }

  static get visibleFields() {
    return [
      "_id",
      "organization_id",
      "user_id",
      "name",
      "size",
      "content_type",
      "object_id",
      "created_at",
      "updated_at",
    ]
  }
}

export default File
