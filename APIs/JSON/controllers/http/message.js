import BaseHttpController from "./base.js"

import ServiceLocatorContainer from "@sama/common/ServiceLocatorContainer.js"

import MessageResponse from "@sama/DTO/Response/message/create/response.js"
import SystemMessageResponse from "@sama/DTO/Response/message/system/response.js"
import EditMessageResponse from "@sama/DTO/Response/message/edit/response.js"
import ReadMessagesResponse from "@sama/DTO/Response/message/read/response.js"
import DeleteMessagesResponse from "@sama/DTO/Response/message/delete/response.js"

import DeliverMessage from "@sama/networking/models/DeliverMessage.js"
import Response from "@sama/networking/models/Response.js"

class HttpMessageController extends BaseHttpController {
  async message(res, req) {
    const createMessageParams = res.parsedBody

    console.log("[HttpMessageController][message][createMessageParams]", createMessageParams)

    const response = new Response()

    const httpMessageCreateOperation = ServiceLocatorContainer.use("HttpMessageCreateOperation")
    const createMessageResponse = await httpMessageCreateOperation.perform(req.fakeWsSessionKey, createMessageParams)
    const { messageId, message: message, deliverMessages, participantIds } = createMessageResponse

    deliverMessages.forEach((event) => {
      const deliverMessage = new DeliverMessage(
        event.participantIds || participantIds,
        new MessageResponse(event.message)
      ).addPushQueueMessage(event.notification)
      response.addDeliverMessage(deliverMessage)
    })

    return response.addBackMessage({
      ask: { mid: messageId, server_mid: message._id, t: message.t },
    })
  }
}

export default new HttpMessageController()
