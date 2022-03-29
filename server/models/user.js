import BaseModel from './base/base.js';
import { hashPassword } from '../utils/crypto_utils.js';

export default class User extends BaseModel {
  constructor(params) {
    super(params);

    this.hooks.beforeSave = this._beforeSaveActions.bind(this);

  }

  get collection() {
    return 'users'
  }

  get visibleFields() {
    return ['_id', 'created_at', 'updated_at', 'login'];
  }

  async _beforeSaveActions() {
    await this.encryptAndSetPassword()
  }

  async encryptAndSetPassword() {
    const password = this.params.password;
    if (!password) {
      return;
    }
    const { encryptedPassword, salt } = await hashPassword(password)
    delete this.params.password;
    this.params['password_salt'] = salt;
    this.params['encrypted_password'] = encryptedPassword;
  }
}