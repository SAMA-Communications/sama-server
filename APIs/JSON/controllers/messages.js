import BaseJSONController from "./base.js"

import ServiceLocatorContainer from "@sama/common/ServiceLocatorContainer.js"

import MessageResponse from "@sama/DTO/Response/message/create/response.js"
import SystemMessageResponse from "@sama/DTO/Response/message/system/response.js"
import EditMessageResponse from "@sama/DTO/Response/message/edit/response.js"
import MessageReactionsUpdateResponse from "@sama/DTO/Response/message/reactions_update/response.js"
import ReadMessagesResponse from "@sama/DTO/Response/message/read/response.js"
import DeleteMessagesResponse from "@sama/DTO/Response/message/delete/response.js"

import DeliverMessage from "@sama/networking/models/DeliverMessage.js"
import Response from "@sama/networking/models/Response.js"

class MessagesController extends BaseJSONController {
  async create(ws, data) {
    const { message: messageParams } = data

    const response = new Response()

    const messageCreateOperation = ServiceLocatorContainer.use("MessageCreateOperation")
    const { messageId, message, deliverMessages, participantIds, modifiedFields, botMessage } =
      await messageCreateOperation.perform(ws, messageParams)

    deliverMessages.forEach((event) => {
      const deliverMessage = new DeliverMessage(
        event.participantIds || participantIds,
        new MessageResponse(event.message)
      ).addPushQueueMessage(event.notification)
      response.addDeliverMessage(deliverMessage)
    })

    return response.addBackMessage({
      ask: { mid: messageId, server_mid: message._id, t: message.t, modified: modifiedFields, bot_message: botMessage },
    })
  }

  async sendSystem(ws, data) {
    const { system_message: systemMessageParams } = data

    const messageSendSystemOperation = ServiceLocatorContainer.use("MessageSendSystemOperation")
    const { recipientsIds, systemMessage } = await messageSendSystemOperation.perform(ws, systemMessageParams)

    return new Response()
      .addBackMessage({ ask: { mid: systemMessage._id, t: systemMessage.t } })
      .addDeliverMessage(new DeliverMessage(recipientsIds, new SystemMessageResponse(systemMessage), true))
  }

  async edit(ws, data) {
    const { id: requestId, message_edit: messageParams } = data

    const messageEditOperation = ServiceLocatorContainer.use("MessageEditOperation")
    const { editedMessage, participantIds } = await messageEditOperation.perform(ws, messageParams)

    return new Response()
      .addBackMessage({ response: { id: requestId, success: true } })
      .addDeliverMessage(new DeliverMessage(participantIds, new EditMessageResponse(editedMessage), true))
  }

  async reactions_update(ws, data) {
    const { id: requestId, message_reactions_update: messageReactionsUpdatePayload } = data

    const messageReactionsUpdateOperation = ServiceLocatorContainer.use("MessageReactionsUpdateOperation")
    const { isUpdated, messageReactionsUpdate, participantIds } = await messageReactionsUpdateOperation.perform(
      ws,
      messageReactionsUpdatePayload
    )

    const response = new Response().addBackMessage({ response: { id: requestId, success: true } })

    if (isUpdated) {
      response.addDeliverMessage(
        new DeliverMessage(participantIds, new MessageReactionsUpdateResponse(messageReactionsUpdate), true)
      )
    }

    return response
  }

  async list(ws, data) {
    const { id: requestId, message_list: messagesListParams } = data

    const messageListOperation = ServiceLocatorContainer.use("MessageListOperation")
    const messages = await messageListOperation.perform(ws, messagesListParams)

    return new Response().addBackMessage({
      response: {
        id: requestId,
        messages: messages,
      },
    })
  }

  async reactions_list(ws, data) {
    const { id: requestId, message_reactions_list: messageReactionsListParams } = data

    const messageReactionsListOperation = ServiceLocatorContainer.use("MessageReactionsListOperation")
    const { reactions } = await messageReactionsListOperation.perform(ws, messageReactionsListParams)

    return new Response().addBackMessage({ response: { id: requestId, reactions } })
  }

  async read(ws, data) {
    const { id: requestId, message_read: messagesReadOptions } = data

    const messageReadOperation = ServiceLocatorContainer.use("MessageReadOperation")
    const { readMessagesGroups } = await messageReadOperation.perform(ws, messagesReadOptions)

    const response = new Response()

    for (const readMessagesGroup of readMessagesGroups) {
      const { userId, readMessages } = readMessagesGroup
      response.addDeliverMessage(new DeliverMessage([userId], new ReadMessagesResponse(readMessages)))
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

    const messageDeleteOperation = ServiceLocatorContainer.use("MessageDeleteOperation")
    const { deletedMessages, participantIds } = await messageDeleteOperation.perform(ws, messageDeleteParams)

    const response = new Response()

    if (deletedMessages) {
      response.addDeliverMessage(new DeliverMessage(participantIds, new DeleteMessagesResponse(deletedMessages), true))
    }

    return response.addBackMessage({
      response: {
        id: requestId,
        success: true,
      },
    })
  }

  async summary(ws, data) {
    const { id: requestId, message_summary: messagesSummaryOptions } = data

    const messageSummaryOperation = ServiceLocatorContainer.use("MessageSummaryOperation")
    const { message } = await messageSummaryOperation.perform(ws, messagesSummaryOptions)

    const response = new Response()

    return response.addBackMessage({
      response: {
        id: requestId,
        message: message,
      },
    })
  }

  async tone(ws, data) {
    const { id: requestId, message_tone: messagesToneOptions } = data

    const messageToneOperation = ServiceLocatorContainer.use("MessageToneOperation")
    const { message } = await messageToneOperation.perform(ws, messagesToneOptions)

    const response = new Response()

    return response.addBackMessage({
      response: {
        id: requestId,
        message: message,
      },
    })
  }
}

export default new MessagesController()
