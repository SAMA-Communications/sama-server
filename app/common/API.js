export default class BaseAPI {
  providers = [] // array of provider call { register, boot }

  detectMessage(ws, message) {
    // return true/false
  }

  async onMessage(ws, message) {
    // Response object
  }

  buildLastActivityPackage(userId, timestamp, status) {
    // return string/null
  }

  async mapPacketToAnotherAPI(destinationAPIType, packet) {
    // return string/null
  }

  async mapPacketFromAnotherAPI(sourceAPIType, packet) {
    // return string/null
  }
}