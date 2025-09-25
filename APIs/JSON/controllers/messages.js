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
    const { organizationId, messageId, message, deliverMessages, cId, participantIds, modifiedFields, botMessage } =
      await messageCreateOperation.perform(ws, messageParams)

    deliverMessages.forEach((event) => {
      const deliverMessage = new DeliverMessage(organizationId, new MessageResponse(event.message)).addPushQueueMessage(event.notification)

      const participantsDestination = event.participantIds ?? participantIds
      deliverMessage.setUsersDestination(participantsDestination)
      deliverMessage.setConversationDestination(cId)

      response.addDeliverMessage(deliverMessage)
    })

    return response.addBackMessage({
      ask: { mid: messageId, server_mid: message._id, t: message.t, modified: modifiedFields, bot_message: botMessage },
    })
  }

  async sendSystem(ws, data) {
    const { system_message: systemMessageParams } = data

    const messageSendSystemOperation = ServiceLocatorContainer.use("MessageSendSystemOperation")
    const { organizationId, cId, recipientsIds, systemMessage } = await messageSendSystemOperation.perform(ws, systemMessageParams)

    const deliverMessage = new DeliverMessage(organizationId, new SystemMessageResponse(systemMessage), true)
      .setConversationDestination(cId)
      .setUsersDestination(recipientsIds)

    return new Response().addBackMessage({ ask: { mid: systemMessage._id, t: systemMessage.t } }).addDeliverMessage(deliverMessage)
  }

  async edit(ws, data) {
    const { id: requestId, message_edit: messageParams } = data

    const messageEditOperation = ServiceLocatorContainer.use("MessageEditOperation")
    const { organizationId, cId, participantsIds, editedMessage } = await messageEditOperation.perform(ws, messageParams)

    return new Response()
      .addBackMessage({ response: { id: requestId, success: true } })
      .addDeliverMessage(
        new DeliverMessage(organizationId, new EditMessageResponse(editedMessage), true)
          .setConversationDestination(cId)
          .setUsersDestination(participantsIds)
      )
  }

  async reactions_update(ws, data) {
    const { id: requestId, message_reactions_update: messageReactionsUpdatePayload } = data

    const messageReactionsUpdateOperation = ServiceLocatorContainer.use("MessageReactionsUpdateOperation")
    const { organizationId, cId, participantsIds, isUpdated, messageReactionsUpdate } = await messageReactionsUpdateOperation.perform(
      ws,
      messageReactionsUpdatePayload
    )

    const response = new Response().addBackMessage({ response: { id: requestId, success: true } })

    if (isUpdated) {
      response.addDeliverMessage(
        new DeliverMessage(organizationId, new MessageReactionsUpdateResponse(messageReactionsUpdate), true)
          .setConversationDestination(cId)
          .setUsersDestination(participantsIds)
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
    const { organizationId, readMessagesGroups } = await messageReadOperation.perform(ws, messagesReadOptions)

    const response = new Response()

    for (const readMessagesGroup of readMessagesGroups) {
      const { userId, readMessages } = readMessagesGroup
      response.addDeliverMessage(new DeliverMessage(organizationId, new ReadMessagesResponse(readMessages)).setUsersDestination([userId]))
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
    const { organizationId, cId, participantsIds, deletedMessages } = await messageDeleteOperation.perform(ws, messageDeleteParams)

    const response = new Response()

    if (deletedMessages) {
      response.addDeliverMessage(
        new DeliverMessage(organizationId, new DeleteMessagesResponse(deletedMessages), true)
          .setConversationDestination(cId)
          .setUsersDestination(participantsIds)
      )
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
