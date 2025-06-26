import { detectAPIType, BASE_API, APIs } from "./APIs.js"

class PacketMapper {
  detectAPIType(packet) {
    const apiType = detectAPIType(null, packet)
    if (!apiType) {
      return BASE_API
    }

    return apiType.at(0)
  }

  async mapPacket(sourceAPIType, destinationAPIType, packet, senderInfo, recipientInfo) {
    if (!sourceAPIType) {
      sourceAPIType = this.detectAPIType(packet)
    }

    if (!destinationAPIType) {
      destinationAPIType = BASE_API
    }

    if (sourceAPIType === destinationAPIType) {
      return packet
    }

    if (sourceAPIType === BASE_API) {
      return await APIs[destinationAPIType].mapPacketFromAnotherAPI(sourceAPIType, packet, senderInfo, recipientInfo)
    }

    if (destinationAPIType === BASE_API) {
      return await APIs[sourceAPIType].mapPacketToAnotherAPI(destinationAPIType, packet, senderInfo, recipientInfo)
    }
  }

  mapRecipientPacket(destinationAPIType, packet, senderInfo, recipientInfo) {
    console.log("[mapRecipientPacket]", destinationAPIType, packet, senderInfo, recipientInfo)

    if (!destinationAPIType) {
      destinationAPIType = this.detectAPIType(packet)
    }

    return APIs[destinationAPIType].mapRecipientPacket(packet, senderInfo, recipientInfo)
  }
}

export default new PacketMapper()
