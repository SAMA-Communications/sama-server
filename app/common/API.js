export default class BaseAPI {
  detectMessage(ws, message) {
    // return true/false
  }

  async onMessage(ws, message) {
    // return string/null
  }

  buildLastActivityPackage(userId, timestamp, status) {
    // return string/null
  }
}