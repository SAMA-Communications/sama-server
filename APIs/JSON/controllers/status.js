import BaseJSONController from "./base.js"

import ServiceLocatorContainer from "@sama/common/ServiceLocatorContainer.js"

import DeliverMessage from "@sama/networking/models/DeliverMessage.js"
import Response from "@sama/networking/models/Response.js"

class StatusesController extends BaseJSONController {
  async typing(ws, data) {
    const { typing: typingParams } = data

    const statusTypingOperation = ServiceLocatorContainer.use("StatusTypingOperation")
    const { status, participantIds } = await statusTypingOperation.perform(ws, typingParams)

    return new Response().addDeliverMessage(new DeliverMessage(participantIds, status))
  }
}

export default new StatusesController()
