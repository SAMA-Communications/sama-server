export default class BaseAPI {
  config = {}
  providers = [] // array of provider call { register, boot }

  detectMessage(ws, message) {
    // return true/false
  }

  createOnPackagesListener(callback) {
    return (packet) => callback(null, packet)
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
