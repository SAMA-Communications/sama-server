import BaseModel from "./base.js"
import type { UserNativeId, OrganizationNativeId, ObjectId } from "../types/common.js"
import type { BaseModelProps } from "./base.js"

export type UserModelProps = BaseModelProps & {
  _id: ObjectId,
  native_id: UserNativeId,

  organization_id: OrganizationNativeId,
  
  created_at: Date
  updated_at: Date,
  recent_activity: Date,

  first_name: string,
  last_name: string,
  login: string,
  email: string,
  phone: string,

  avatar_object: any,
  avatar_url: string,

  encrypted_password: string,
  password_salt: string,
}

export default class User extends BaseModel {
  static get collection() {
    return "users"
  }

  static get visibleFields() {
    return [
      "_id",
      "native_id",

      "created_at",
      "updated_at",
      "recent_activity",

      "first_name",
      "last_name",
      "login",
      "email",
      "phone",

      "avatar_object",
      "avatar_url",
    ]
  }

  static get originalFields() {
    return [
      "_id",
      "organization_id",

      "created_at",
      "updated_at",
      "recent_activity",

      "first_name",
      "last_name",
      "login",
      "email",
      "phone",

      "avatar_object",
      "avatar_url",

      "encrypted_password",
      "password_salt",
    ]
  }
}
