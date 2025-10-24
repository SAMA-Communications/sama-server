import BaseJSONController from "./base.js"

import ServiceLocatorContainer from "@sama/common/ServiceLocatorContainer.js"

import Response from "@sama/networking/models/Response.js"

class ConversationHandlersController extends BaseJSONController {
  async create(ws, data) {
    const { id: requestId, conversation_handler_create: handlerParams } = data

    const conversationHandlerCreateOperation = ServiceLocatorContainer.use("ConversationHandlerCreateOperation")
    await conversationHandlerCreateOperation.perform(ws, handlerParams)

    return new Response().addBackMessage({ response: { id: requestId, success: true } })
  }

  async get(ws, data) {
    const { id: requestId, get_conversation_handler: handlerGetOptions } = data

    const conversationHandlerGetOperation = ServiceLocatorContainer.use("ConversationHandlerGetOperation")
    const conversationHandler = await conversationHandlerGetOperation.perform(ws, handlerGetOptions)

    return new Response().addBackMessage({
      response: { id: requestId, conversation_handler: conversationHandler },
    })
  }

  async delete(ws, data) {
    const { id: requestId, conversation_handler_delete: handlerParams } = data

    const conversationHandlerDeleteOperation = ServiceLocatorContainer.use("ConversationHandlerDeleteOperation")
    await conversationHandlerDeleteOperation.perform(ws, handlerParams)

    return new Response().addBackMessage({
      response: {
        id: requestId,
        success: true,
      },
    })
  }
}

export default new ConversationHandlersController()
