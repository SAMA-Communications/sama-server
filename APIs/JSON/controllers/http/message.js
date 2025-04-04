import BaseHttpController from "./base.js"

import ServiceLocatorContainer from "@sama/common/ServiceLocatorContainer.js"

import MessageResponse from "@sama/DTO/Response/message/create/response.js"
import SystemMessageResponse from "@sama/DTO/Response/message/system/response.js"
import EditMessageResponse from "@sama/DTO/Response/message/edit/response.js"
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
    const { messageId, message: message, deliverMessages, participantIds } = createMessageResponse

    deliverMessages.forEach((event) => {
      const deliverMessage = new DeliverMessage(
        event.participantIds || participantIds,
        new MessageResponse(event.message)
      ).addPushQueueMessage(event.notification)
      response.addDeliverMessage(deliverMessage)
    })

    return response.setHttpResponse(
      new HttpResponse(
        201,
        {},
        {
          ask: { mid: messageId, server_mid: message._id, t: message.t },
        }
      )
    )
  }

  async system_message(res, req) {
    const payload = res.parsedBody

    const messageSendSystemOperation = ServiceLocatorContainer.use("HttpMessageSendSystemOperation")
    const { recipientsIds, systemMessage } = await messageSendSystemOperation.perform(res.fakeWsSessionKey, payload)

    return new Response()
      .setHttpResponse(new HttpResponse(201, {}, { ask: { mid: systemMessage._id, t: systemMessage.t } }))
      .addDeliverMessage(new DeliverMessage(recipientsIds, new SystemMessageResponse(systemMessage), true))
  }

  async read(res, req) {
    const payload = res.parsedBody

    const messageReadOperation = ServiceLocatorContainer.use("HttpMessageReadOperation")
    const { readMessagesGroups } = await messageReadOperation.perform(res.fakeWsSessionKey, payload)

    const response = new Response()

    for (const readMessagesGroup of readMessagesGroups) {
      const { userId, readMessages } = readMessagesGroup
      response.addDeliverMessage(new DeliverMessage([userId], new ReadMessagesResponse(readMessages)))
    }

    return response.setHttpResponse(new HttpResponse(200, {}, { success: true }))
  }

  async edit(res, req) {
    const payload = res.parsedBody

    const messageEditOperation = ServiceLocatorContainer.use("HttpMessageEditOperation")
    const { editedMessage, participantIds } = await messageEditOperation.perform(res.fakeWsSessionKey, payload)

    return new Response()
      .setHttpResponse(new HttpResponse(200, {}, { success: true }))
      .addDeliverMessage(new DeliverMessage(participantIds, new EditMessageResponse(editedMessage), true))
  }

  async delete(res, req) {
    const payload = res.parsedBody

    const messageDeleteOperation = ServiceLocatorContainer.use("HttpMessageDeleteOperation")
    const { deletedMessages, participantIds } = await messageDeleteOperation.perform(res.fakeWsSessionKey, payload)

    const response = new Response()

    if (deletedMessages) {
      response.addDeliverMessage(new DeliverMessage(participantIds, new DeleteMessagesResponse(deletedMessages), true))
    }

    return response.setHttpResponse(new HttpResponse(200, {}, { success: true }))
  }
}

export default new HttpMessageController()
