import BaseJSONController from './base.js'

import validate, {
  validateIsConversation,
  validateIsConversationByCID,
  validateIsUserHasPermission,
} from '@sama/lib/validation.js'

import { CONSTANTS as MAIN_CONSTANTS } from '@sama/constants/constants.js'

import ServiceLocatorContainer from '@sama/common/ServiceLocatorContainer.js'

import Message from '@sama/models/message.js'
import MessageStatus from '@sama/models/message_status.js'

import conversationParticipantsRepository from '@sama/repositories/conversation_participants_repository.js'
import sessionRepository from '@sama/repositories/session_repository.js'

import { ObjectId } from '@sama/lib/db.js'

import DeliverMessage from '@sama/networking/models/DeliverMessage.js'
import Response from '@sama/networking/models/Response.js'


class MessagesController extends BaseJSONController {
  async create(ws, data) {
    const { message: messageParams } = data

    const messageCreateOperation = ServiceLocatorContainer.use('MessageCreateOperation')
    const { messageId, message, deliverMessages } = await messageCreateOperation.perform(ws, messageParams)

    return new Response().addBackMessage({
      ask: { mid: messageId, server_mid: message.params._id, t: message.params.t },
    }).addDeliverMessage(...deliverMessages)
  }

  async edit(ws, data) {
    const { id: requestId, message_edit: messageParams } = data

    const messageEditOperation = ServiceLocatorContainer.use('MessageEditOperation')
    const { messageId, body, from, participantIds } = await messageEditOperation.perform(ws, messageParams)

    return new Response()
      .addBackMessage({ response: { id: requestId, success: true } })
      .addDeliverMessage(new DeliverMessage( participantIds, {
          message_edit: {
            id: messageId,
            body: body,
            from: from,
          }
        }, true)
      )
  }

  async list(ws, data) {
    const {
      id: requestId,
      message_list: { cid, limit, updated_at },
    } = data

    const currentUserId = sessionRepository.getSessionUserId(ws)

    await validate(ws, { id: cid, cid, uId: currentUserId }, [
      validateIsConversation,
      validateIsUserHasPermission,
    ])

    const limitParam =
      limit > MAIN_CONSTANTS.LIMIT_MAX
        ? MAIN_CONSTANTS.LIMIT_MAX
        : limit || MAIN_CONSTANTS.LIMIT_MAX

    const query = {
      cid,
      deleted_for: { $nin: [currentUserId] },
    }
    const timeFromUpdate = updated_at
    if (timeFromUpdate) {
      timeFromUpdate.gt &&
        (query.updated_at = { $gt: new Date(timeFromUpdate.gt) })
      timeFromUpdate.lt &&
        (query.updated_at = { $lt: new Date(timeFromUpdate.lt) })
    }

    const messages = await Message.findAll(
      query,
      Message.visibleFields,
      limitParam
    )

    const messagesStatus = await MessageStatus.getReadStatusForMids(
      messages.map((msg) => msg._id)
    )

    return new Response().addBackMessage({
      response: {
        id: requestId,
        messages: messages.map((msg) => {
          if (msg.from.toString() === currentUserId) {
            msg['status'] = messagesStatus[msg._id]?.length ? 'read' : 'sent'
          }
          return msg
        }),
      },
    })
  }

  async read(ws, data) {
    const { id: requestId, message_read: messagesReadOptions } = data

    const messageReadOperation = ServiceLocatorContainer.use('MessageReadOperation')
    const unreadMessagesGroupedByFrom = await messageReadOperation.perform(ws, messagesReadOptions)

    const response = new Response()

    for (const uId in unreadMessagesGroupedByFrom) {
      const firstMessage = unreadMessagesGroupedByFrom[uId].at(0)
      const cid = firstMessage.cid
      const mids = unreadMessagesGroupedByFrom[uId].map(message => message._id)
      const message = {
        message_read: {
          cid: cid,
          ids: mids,
          from: uId,
        },
      }

      response.addDeliverMessage(new DeliverMessage([uId], message))
    }

    return response.addBackMessage({
      response: {
        id: requestId,
        success: true,
      },
    })
  }

  async delete(ws, data) {
    const {
      id: requestId,
      message_delete: messageDeleteParams,
    } = data

    const messageDeleteOperation = ServiceLocatorContainer.use('MessageDeleteOperation')
    const { isDeleteAll, participantIds, info: { userId, cId, mIds } } = await messageDeleteOperation.perform(ws, messageDeleteParams)

    const response = new Response()

    if (isDeleteAll) {
      const request = {
        message_delete: {
          cid: cId,
          ids: mIds,
          type: 'all',
          from: userId,
        },
      }

      response.addDeliverMessage(new DeliverMessage(participantIds, request, true))
    }

    return response.addBackMessage({
      response: {
        id: requestId,
        success: true,
      },
    })
  }
}

export default new MessagesController()
