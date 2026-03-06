import { StringDecoder } from "node:string_decoder"
import { v4 as uuid } from "uuid"

import logger from "../../logger/index.js"
import { createStore } from "../../logger/async_store.js"
import { ERROR_STATUES } from "../../constants/errors.js"
import { CONSTANTS as MAIN_CONSTANTS } from "../../constants/constants.js"
import { BASE_API, APIs, detectAPIType } from "../APIs.js"

import packetManager from "../packet_manager.js"
import packetMapper from "../packet_mapper.js"

import activitySender from "../activity_sender.js"

import MappableMessage from "../models/MappableMessage.js"

const decoder = new StringDecoder("utf8")

const mapBackMessageFunc = async (socket, packet) => packetMapper.mapPacket(null, socket.apiType, packet, {}, {})

class BaseProtocolProcessor {
  constructor(sessionService, conversationService) {
    this.sessionService = sessionService
    this.conversationService = conversationService
  }

  static defineProtocolTpe(socket) {
    return "Socket"
  }

  requestCreateStoreContext = (socket) =>
    createStore({
      [MAIN_CONSTANTS.LOGGER_BINDINGS_NAMES.PROTOCOL_TYPE]: this.constructor.defineProtocolTpe(socket),
      [MAIN_CONSTANTS.LOGGER_BINDINGS_NAMES.CLIENT_ID]: socket?.clientId ?? this.socketAddress(socket),
      [MAIN_CONSTANTS.LOGGER_BINDINGS_NAMES.SERVER_REQUEST_ID]: uuid(),
      [MAIN_CONSTANTS.LOGGER_BINDINGS_NAMES.REQUEST_START_TIME]: +new Date(),
    })

  socketAddress(socket) {
    return socket?.ip ?? "socket-address"
  }

  onOpen(socket) {
    this.extendSocket(socket)

    logger.trace("[Open] IP: %s CLIENT_ID: %s", this.socketAddress(socket), socket.clientId)

    return socket
  }

  extendSocket(socket) {
    socket.clientId = uuid()
    socket.isAlive = true
    return socket
  }

  removeExtends(socket) {
    return socket
  }

  decodePackage(socket, buffer) {
    const stringMessage = decoder.write(Buffer.from(buffer))

    logger.trace("[RECV] %s %s", stringMessage, stringMessage?.length)

    if (!stringMessage?.length) {
      return
    }

    return stringMessage
  }

  async onPackage(socket, packageData) {
    let stringMessage = packageData
    try {
      stringMessage = this.decodePackage(socket, packageData)
      await this.processPackage(socket, stringMessage)
    } catch (error) {
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
      this.closeSocket(socket)
      return
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

        logger.trace("[SENT] %s", backPackage)

        await socket?.safeSend(backPackage)
      } catch (error) {
        logger.error(error, "[ClientManager][error]")
      }
    }
  }

  async processUpdateLastActivityResponse(socket, response) {
    let { organizationId, userId } = this.sessionService?.getSession(socket) ?? {}
    organizationId = response.lastActivityStatusResponse.orgId ?? organizationId
    userId = response.lastActivityStatusResponse.userId ?? userId

    logger.trace("[UPDATE_LAST_ACTIVITY] %o", response.lastActivityStatusResponse)

    const responses = await activitySender.updateAndBuildUserActivity(
      socket,
      organizationId,
      userId,
      response.lastActivityStatusResponse.status
    )

    responses.forEach((activityResponse) => response.merge(activityResponse))

    return response
  }

  async processDeliverResponse(socket, deliverPackages) {
    for (const deliverPackage of deliverPackages) {
      logger.trace("[DELIVER] %o", deliverPackage)

      deliverPackage.socket ??= socket

      if (deliverPackage.userIds?.length) {
        await this.processDeliverUserMessage(deliverPackage)
      } else if (deliverPackage.cId) {
        await this.processDeliverConversationMessage(deliverPackage)
      }
    }
  }

  async processDeliverUserMessage(deliverMessage, participantIds) {
    try {
      const sourceOptions = {
        organizationId: deliverMessage.orgId,
        socket: deliverMessage.socket,
      }

      const destinationUserIds = participantIds ?? deliverMessage.userIds

      const payloadOptions = {
        packet: deliverMessage.packet,
        notSaveInOfflineStorage: deliverMessage.notSaveInOfflineStorage,
        ignoreSelf: deliverMessage.ignoreSelf,
        pushQueueMessage: deliverMessage.pushQueueMessage
      }

      await packetManager.deliverToUserOrUsers(
        sourceOptions,
        destinationUserIds,
        payloadOptions
      )
    } catch (error) {
      logger.error(error, "[PacketManager][error]")
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

  async onClose(socket, code) {
    logger.trace("[Close] IP: %s CLIENT_ID: %s CODE: %s", this.socketAddress(socket), socket.clientId, code)

    socket.isAlive = false

    await this.updateLastUserLastActivityOnClose(socket)

    this.removeExtends(socket)

    return socket
  }

  async updateLastUserLastActivityOnClose(socket) {
    const { organizationId, userId } = this.sessionService.getSession(socket) ?? {}

    logger.trace("[UPDATE_LAST_ACTIVITY][CLOSE] OrgId: %s UserId: %s", organizationId, userId)

    if (!userId) {
      return
    }

    const isWasLastUserSession = await this.sessionService.removeUserSession(socket, userId)

    if (!isWasLastUserSession) {
      return
    }

    await this.processAPIResponse(socket, activitySender.buildOfflineActivityResponse(organizationId, userId), true)
  }

  closeSocket(socket) {
    socket.close()
  }

  onProcessingError(socket, error, packageData) {
    logger.error(error, "[onPackage] %j", packageData)

    return socket?.safeSend(
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
