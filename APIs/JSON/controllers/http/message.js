import BaseHttpController from "./base.js"

import ServiceLocatorContainer from "@sama/common/ServiceLocatorContainer.js"

import MessageResponse from "@sama/DTO/Response/message/create/response.js"
import SystemMessageResponse from "@sama/DTO/Response/message/system/response.js"
import EditMessageResponse from "@sama/DTO/Response/message/edit/response.js"
import MessageReactionsUpdateResponse from "@sama/DTO/Response/message/reactions_update/response.js"
import ReadMessagesResponse from "@sama/DTO/Response/message/read/response.js"
import DeleteMessagesResponse from "@sama/DTO/Response/message/delete/response.js"

import HttpResponse from "@sama/networking/models/HttpResponse.js"
import DeliverMessage from "@sama/networking/models/DeliverMessage.js"
import Response from "@sama/networking/models/Response.js"

class HttpMessageController extends BaseHttpController {
  async message(res, req) {
    const payload = res.parsedBody

    const response = new Response()

    const httpMessageCreateOperation = ServiceLocatorContainer.use("HttpMessageCreateOperation")
    const createMessageResponse = await httpMessageCreateOperation.perform(res.fakeWsSessionKey, payload)
    const { organizationId, messageId, message, deliverMessages, cId, participantIds, modifiedFields, botMessage } = createMessageResponse

    deliverMessages.forEach((event) => {
      const deliverMessage = new DeliverMessage(organizationId, new MessageResponse(event.message)).addPushQueueMessage(event.notification)

      const participantsDestination = event.participantIds ?? participantIds
      deliverMessage.setUsersDestination(participantsDestination)
      deliverMessage.setConversationDestination(cId)

      response.addDeliverMessage(deliverMessage)
    })

    return response.setHttpResponse(
      new HttpResponse(
        201,
        {},
        {
          ask: { mid: messageId, server_mid: message._id, t: message.t, modified: modifiedFields, bot_message: botMessage },
        }
      )
    )
  }

  async system_message(res, req) {
    const payload = res.parsedBody

    const messageSendSystemOperation = ServiceLocatorContainer.use("HttpMessageSendSystemOperation")
    const { organizationId, cId, recipientsIds, systemMessage } = await messageSendSystemOperation.perform(res.fakeWsSessionKey, payload)

    const deliverMessage = new DeliverMessage(organizationId, new SystemMessageResponse(systemMessage), true)
      .setConversationDestination(cId)
      .setUsersDestination(recipientsIds)

    return new Response()
      .setHttpResponse(new HttpResponse(201, {}, { ask: { mid: systemMessage._id, t: systemMessage.t } }))
      .addDeliverMessage(deliverMessage)
  }

  async read(res, req) {
    const payload = res.parsedBody

    const messageReadOperation = ServiceLocatorContainer.use("HttpMessageReadOperation")
    const { organizationId, readMessagesGroups } = await messageReadOperation.perform(res.fakeWsSessionKey, payload)

    const response = new Response()

    for (const readMessagesGroup of readMessagesGroups) {
      const { userId, readMessages } = readMessagesGroup
      response.addDeliverMessage(new DeliverMessage(organizationId, new ReadMessagesResponse(readMessages)).setUsersDestination([userId]))
    }

    return response.setHttpResponse(new HttpResponse(200, {}, { success: true }))
  }

  async edit(res, req) {
    const payload = res.parsedBody

    const messageEditOperation = ServiceLocatorContainer.use("HttpMessageEditOperation")
    const { organizationId, cId, participantsIds, editedMessage } = await messageEditOperation.perform(res.fakeWsSessionKey, payload)

    return new Response()
      .setHttpResponse(new HttpResponse(200, {}, { success: true }))
      .addDeliverMessage(
        new DeliverMessage(organizationId, new EditMessageResponse(editedMessage), true)
          .setConversationDestination(cId)
          .setUsersDestination(participantsIds)
      )
  }

  async reaction(res, req) {
    const payload = res.parsedBody

    const messageReactionOperation = ServiceLocatorContainer.use("HttpMessageReactionOperation")
    const { organizationId, cId, participantsIds, messageReactionsUpdate } = await messageReactionOperation.perform(
      res.fakeWsSessionKey,
      payload
    )

    return new Response()
      .setHttpResponse(new HttpResponse(200, {}, { success: true }))
      .addDeliverMessage(
        new DeliverMessage(organizationId, new MessageReactionsUpdateResponse(messageReactionsUpdate), true)
          .setConversationDestination(cId)
          .setUsersDestination(participantsIds)
      )
  }

  async delete(res, req) {
    const payload = res.parsedBody

    const messageDeleteOperation = ServiceLocatorContainer.use("HttpMessageDeleteOperation")
    const { organizationId, cId, participantsIds, deletedMessages } = await messageDeleteOperation.perform(res.fakeWsSessionKey, payload)

    const response = new Response()

    if (deletedMessages) {
      response.addDeliverMessage(
        new DeliverMessage(organizationId, new DeleteMessagesResponse(deletedMessages), true)
          .setConversationDestination(cId)
          .setUsersDestination(participantsIds)
      )
    }

    return response.setHttpResponse(new HttpResponse(200, {}, { success: true }))
  }
}

export default new HttpMessageController()
