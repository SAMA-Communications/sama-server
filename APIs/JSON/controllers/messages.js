import BaseJSONController from './base.js'

import ServiceLocatorContainer from '@sama/common/ServiceLocatorContainer.js'

import DeliverMessage from '@sama/networking/models/DeliverMessage.js'
import Response from '@sama/networking/models/Response.js'


class MessagesController extends BaseJSONController {
  async create(ws, data) {
    const { message: messageParams } = data

    const response = new Response()

    const messageCreateOperation = ServiceLocatorContainer.use('MessageCreateOperation')
    const { messageId, message, deliverMessages, participantIds } = await messageCreateOperation.perform(ws, messageParams)

    deliverMessages.forEach(event => {
      const deliverMessage = new DeliverMessage(event.participantIds || participantIds, event.message).addPushQueueMessage(event.notification)
      response.addDeliverMessage(deliverMessage)
    })

    return response.addBackMessage({
      ask: { mid: messageId, server_mid: message._id, t: message.t },
    })
  }

  async sendSystem(ws, data) {
    const { system_message: systemMessageParams } = data

    const messageSendSystemOperation = ServiceLocatorContainer.use('MessageSendSystemOperation')
    const { recipientsIds, systemMessage } = await messageSendSystemOperation.perform(ws, systemMessageParams)

    return new Response()
      .addBackMessage({ ask: { mid: systemMessage._id, t: systemMessage.t } })
      .addDeliverMessage(new DeliverMessage(recipientsIds, { system_message: systemMessage }, true))
  }

  async edit(ws, data) {
    const { id: requestId, message_edit: messageParams } = data

    const messageEditOperation = ServiceLocatorContainer.use('MessageEditOperation')
    const { messageId, body, from, participantIds } = await messageEditOperation.perform(ws, messageParams)

    return new Response()
      .addBackMessage({ response: { id: requestId, success: true } })
      .addDeliverMessage(new DeliverMessage(participantIds, {
          message_edit: {
            id: messageId,
            body: body,
            from: from,
          }
        }, true)
      )
  }

  async list(ws, data) {
    const { id: requestId, message_list: messagesListParams } = data

    const messageListOperation = ServiceLocatorContainer.use('MessageListOperation')
    const messages = await messageListOperation.perform(ws, messagesListParams)

    return new Response().addBackMessage({
      response: {
        id: requestId,
        messages: messages,
      },
    })
  }

  async read(ws, data) {
    const { id: requestId, message_read: messagesReadOptions } = data

    const messageReadOperation = ServiceLocatorContainer.use('MessageReadOperation')
    const { unreadMessagesGroupedByFrom, currentUserId }  = await messageReadOperation.perform(ws, messagesReadOptions)

    const response = new Response()

    for (const uId in unreadMessagesGroupedByFrom) {
      const firstMessage = unreadMessagesGroupedByFrom[uId].at(0)
      const cId = firstMessage.cid
      const mIds = unreadMessagesGroupedByFrom[uId].map(message => message._id)
      const message = {
        message_read: {
          cid: cId,
          ids: mIds,
          from: currentUserId,
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
    const { id: requestId, message_delete: messageDeleteParams } = data

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
