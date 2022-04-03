import BaseApi from './base/base';

export default class AuthApi extends BaseApi {
  async signUp(params) {
    return this.perform("users", "POST", params)
  }

  async login(params) {
    return this.perform("users/login", "POST", params)
  }

  async logout() {
    return this.perform("users/logout", "POST")
  }
}