import BaseModel from "./base/base.js";
import { hashPassword, verifyPassword } from "../utils/crypto_utils.js";

export default class User extends BaseModel {
  constructor(params) {
    super(params);

    this.hooks.beforeSave = this._beforeSaveActions.bind(this);
  }

  static get collection() {
    return "users";
  }

  static get visibleFields() {
    return [
      "_id",
      "created_at",
      "updated_at",
      "first_name",
      "last_name",
      "login",
      "email",
      "phone",
      "recent_activity",
    ];
  }

  async _beforeSaveActions() {
    await this.encryptAndSetPassword();
  }

  async encryptAndSetPassword() {
    const password = this.params.password;
    if (!password) {
      return;
    }
    const { encryptedPassword, salt } = await hashPassword(password);
    delete this.params.password;
    this.params["password_salt"] = salt;
    this.params["encrypted_password"] = encryptedPassword;
  }

  async isValidPassword(plainPassword) {
    const passwordSalt = this.params.password_salt;
    const passwordEncrypted = this.params.encrypted_password;

    const isSame = await verifyPassword(
      plainPassword,
      passwordEncrypted,
      passwordSalt
    );
    return isSame;
  }
}
