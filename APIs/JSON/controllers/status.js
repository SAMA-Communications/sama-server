import BaseJSONController from "./base.js"

import ServiceLocatorContainer from "@sama/common/ServiceLocatorContainer.js"

import DeliverMessage from "@sama/networking/models/DeliverMessage.js"
import Response from "@sama/networking/models/Response.js"

class StatusesController extends BaseJSONController {
  async ping(ws, data) {
    const { id: requestId, ping } = data

    return new Response().addBackMessage({
      response: {
        id: requestId,
        pong: {},
      },
    })
  }

  async typing(ws, data) {
    const { typing: typingParams } = data

    const statusTypingOperation = ServiceLocatorContainer.use("StatusTypingOperation")
    const { organizationId, cId, status } = await statusTypingOperation.perform(ws, typingParams)

    const deliverMessage = new DeliverMessage(organizationId, status).setConversationDestination(cId)

    return new Response().addDeliverMessage(deliverMessage)
  }
}

export default new StatusesController()
