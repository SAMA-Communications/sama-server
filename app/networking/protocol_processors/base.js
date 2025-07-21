import { StringDecoder } from "string_decoder"

import { ERROR_STATUES } from "../../constants/errors.js"
import { BASE_API, APIs, detectAPIType } from "../APIs.js"

import packetManager from "../packet_manager.js"
import packetMapper from "../packet_mapper.js"

import activitySender from "../../services/activity_sender.js"

import MappableMessage from "../models/MappableMessage.js"

const decoder = new StringDecoder("utf8")

const mapBackMessageFunc = async (ws, packet) => packetMapper.mapPacket(null, ws.apiType, packet, {}, {})

class BaseProtocolProcessor {
  constructor(sessionService, conversationService) {
    this.sessionService = sessionService
    this.conversationService = conversationService
  }

  onOpen(socket) {
    this.extendSocket(socket)

    return socket
  }

  extendSocket(socket) {
    return socket
  }

  removeExtends(socket) {
    return socket
  }

  decodePackage(socket, buffer) {
    const stringMessage = decoder.write(Buffer.from(buffer))?.trim()

    console.log("[RECV]", stringMessage, stringMessage.length)

    if (!stringMessage.length) {
      return
    }

    return stringMessage
  }

  async onPackage(socket, packageData, isDecoded) {
    let stringMessage = packageData
    try {
      stringMessage = isDecoded ? packageData : this.decodePackage(socket, packageData)
      await this.processPackage(socket, stringMessage)
    } catch (error) {
      console.log("[ClientManager] onPackage error", error)
      this.onProcessingError(socket, error, stringMessage)
    }
  }

  async processPackage(socket, decodedPackage) {
    if (!decodedPackage) {
      return
    }

    if (!socket.apiType) {
      const apiType = detectAPIType(socket, decodedPackage)
      if (!apiType) {
        throw new Error("Unknown message format")
      }
      socket.apiType = apiType.at(0)
    }

    const api = APIs[socket.apiType]

    const response = await api.onMessage(socket, decodedPackage)

    await this.processAPIResponse(socket, response)
  }

  async processAPIResponse(socket, response, needStringify) {
    if (needStringify) {
      response = APIs[BASE_API].stringifyResponse(response)
    }

    if (response.lastActivityStatusResponse) {
      await this.processUpdateLastActivityResponse(socket, response)
    }

    await this.processBackResponse(socket, response.backMessages ?? [])

    await this.processDeliverResponse(socket, response.deliverMessages ?? [])

    if (response.closeSocket) {
      socket.end()
    }

    if (response.upgradeTls) {
      socket.emit("upgrade")
    }
  }

  async processBackResponse(socket, backPackages) {
    for (let backPackage of backPackages) {
      try {
        if (backPackage instanceof MappableMessage) {
          backPackage = await backPackage.mapMessage(mapBackMessageFunc.bind(socket))
        }

        console.log("[SENT]", backPackage)

        await socket.safeSend(backPackage)
      } catch (error) {
        console.error("[ClientManager][error]", error)
      }
    }
  }

  async processUpdateLastActivityResponse(socket, response) {
    const userId = response.lastActivityStatusResponse.userId ?? this.sessionService.getSessionUserId(socket)
    console.log("[UPDATE_LAST_ACTIVITY]", userId, response.lastActivityStatusResponse)

    const responses = await activitySender.updateAndBuildUserActivity(socket, userId, response.lastActivityStatusResponse.status)
    responses.forEach((activityResponse) => response.merge(activityResponse))

    return response
  }

  async processDeliverResponse(socket, deliverPackages) {
    for (const deliverPackage of deliverPackages) {
      console.log("[DELIVER]", deliverPackage)

      deliverPackage.ws ??= socket

      if (deliverPackage.userIds?.length) {
        await this.processDeliverUserMessage(deliverPackage)
      } else if (deliverPackage.cId) {
        await this.processDeliverConversationMessage(deliverPackage)
      }
    }
  }

  async processDeliverUserMessage(deliverMessage, participantIds) {
    try {
      await packetManager.deliverToUserOrUsers(
        deliverMessage.ws,
        deliverMessage.packet,
        deliverMessage.pushQueueMessage,
        participantIds ?? deliverMessage.userIds,
        deliverMessage.notSaveInOfflineStorage,
        deliverMessage.ignoreSelf
      )
    } catch (e) {
      console.error("[ClientManager] connection with client socket is lost", e)
    }
  }

  async processDeliverConversationMessage(deliverMessage) {
    const { cId, exceptUserIds } = deliverMessage

    for await (const participantIds of this.conversationService.conversationParticipantIdsIterator(cId, exceptUserIds)) {
      if (!participantIds.length) {
        continue
      }

      await this.processDeliverUserMessage(deliverMessage, participantIds)
    }
  }

  async onClose(socket) {
    await this.updateLastUserLastActivityOnClose(socket)

    this.removeExtends(socket)

    return socket
  }

  async updateLastUserLastActivityOnClose(socket) {
    const userId = this.sessionService.getSessionUserId(socket)

    console.log("[ClientManager] on Close", userId)

    if (!userId) {
      return
    }

    await this.sessionService.removeUserSession(socket, userId)

    await this.processAPIResponse(socket, activitySender.buildOfflineActivityResponse(userId), true)
  }

  onProcessingError(socket, error, packageData) {
    console.log("[ClientManager] onPackage error", error, packageData)

    return socket.safeSend(
      JSON.stringify({
        response: {
          error: {
            status: ERROR_STATUES.INVALID_DATA_FORMAT.status,
            message: ERROR_STATUES.INVALID_DATA_FORMAT.message,
          },
        },
      })
    )
  }
}

export default BaseProtocolProcessor
