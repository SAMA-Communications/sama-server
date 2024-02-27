import BaseJSONController from './base.js'

import ServiceLocatorContainer from '@sama/common/ServiceLocatorContainer.js'

import DeliverMessage from '@sama/networking/models/DeliverMessage.js'
import Response from '@sama/networking/models/Response.js'

class ConversationsController extends BaseJSONController {
  async create(ws, data) {
    const { id: requestId, conversation_create: conversationParams } = data

    const conversationCreateOperation = ServiceLocatorContainer.use('ConversationCreateOperation')
    const { conversation, conversationCreatedMessageNotification } = await conversationCreateOperation.perform(ws, conversationParams)

    return new Response().addBackMessage({
      response: {
        id: requestId,
        conversation: conversation.visibleParams(),
      },
    }).addDeliverMessage(conversationCreatedMessageNotification)
  }

  async update(ws, data) {
    const { id: requestId, conversation_update: conversationParams } = data

    const response = new Response()
  
    const conversationEditOperation = ServiceLocatorContainer.use('ConversationEditOperation')
    const updatedConversation = await conversationEditOperation.perform(ws, conversationParams)

    if (!updatedConversation) {
      return response.addBackMessage({
        response: {
          id: requestId,
          deleted: true,
        },
      })
    }

    return response.addBackMessage({
      response: {
        id: requestId,
        conversation: updatedConversation.visibleParams(),
      },
    })
  }

  async list(ws, data) {
    const { id: requestId, conversation_list: conversationListOptions } = data

    const conversationListOperation = ServiceLocatorContainer.use('ConversationListOperation')
    const conversations = await conversationListOperation.perform(ws, conversationListOptions)

    return new Response().addBackMessage({
      response: {
        id: requestId,
        conversations: conversations,
      },
    })
  }

  async delete(ws, data) {
    const { id: requestId, conversation_delete: { id: conversationId } } = data

    const conversationDeleteOperation = ServiceLocatorContainer.use('ConversationDeleteOperation')
    await conversationDeleteOperation.perform(ws, conversationId)

    return new Response().addBackMessage({
      response: {
        id: requestId,
        success: true
      },
    })
  }

  async get_participants_by_cids(ws, data) {
    const { id: requestId, get_participants_by_cids: options } = data

    const conversationListParticipantsOperation = ServiceLocatorContainer.use('ConversationListParticipantsOperation')
    const users = await conversationListParticipantsOperation.perform(ws, options)

    return new Response().addBackMessage({
      response: { id: requestId, users: users },
    })
  }
}

export default new ConversationsController()
