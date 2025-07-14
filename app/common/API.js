export default class BaseAPI {
  providers = [] // array of provider call { register, boot }

  detectMessage(ws, message) {
    // return true/false
  }

  splitPacket(message) {
    return []
  }

  async onMessage(ws, message) {
    // Response object
  }

  buildLastActivityPackage(userId, timestamp, status) {
    // return string/null
  }

  async mapPacketToAnotherAPI(destinationAPIType, packet) {
    return packet
  }

  async mapPacketFromAnotherAPI(sourceAPIType, packet) {
    return packet
  }

  mapRecipientPacket(packet, senderInfo, recipientInfo) {
    return packet
  }
}
