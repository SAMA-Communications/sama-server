import BaseJSONController from "./base.js"

import ServiceLocatorContainer from "@sama/common/ServiceLocatorContainer.js"

import Response from "@sama/networking/models/Response.js"

class ConversationSchemesController extends BaseJSONController {
  async create(ws, data) {
    const { id: requestId, conversation_scheme_create: schemeParams } = data

    const conversationSchemeCreateOperation = ServiceLocatorContainer.use("ConversationSchemeCreateOperation")
    await conversationSchemeCreateOperation.perform(ws, schemeParams)

    return new Response().addBackMessage({ response: { id: requestId, success: true } })
  }

  async get(ws, data) {
    const { id: requestId, get_conversation_scheme: schemeGetOptions } = data

    const conversationSchemeGetOperation = ServiceLocatorContainer.use("ConversationSchemeGetOperation")
    const conversationScheme = await conversationSchemeGetOperation.perform(ws, schemeGetOptions)

    return new Response().addBackMessage({
      response: { id: requestId, conversation_scheme: conversationScheme },
    })
  }

  async delete(ws, data) {
    const { id: requestId, conversation_scheme_delete: schemeParams } = data

    const conversationSchemeDeleteOperation = ServiceLocatorContainer.use("ConversationSchemeDeleteOperation")
    await conversationSchemeDeleteOperation.perform(ws, schemeParams)

    return new Response().addBackMessage({
      response: {
        id: requestId,
        success: true,
      },
    })
  }
}

export default new ConversationSchemesController()
