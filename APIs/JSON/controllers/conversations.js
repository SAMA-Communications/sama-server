import BaseJSONController from "./base.js"

import ServiceLocatorContainer from "@sama/common/ServiceLocatorContainer.js"

import DeliverMessage from "@sama/networking/models/DeliverMessage.js"
import Response from "@sama/networking/models/Response.js"

class ConversationsController extends BaseJSONController {
  async create(ws, data) {
    const { id: requestId, conversation_create: conversationParams } = data

    const conversationCreateOperation = ServiceLocatorContainer.use("ConversationCreateOperation")
    const { conversation, event } = await conversationCreateOperation.perform(ws, conversationParams)

    const response = new Response().addBackMessage({
      response: {
        id: requestId,
        conversation: conversation.visibleParams(),
      },
    })

    if (event) {
      const deliverMessage = new DeliverMessage(event.participantIds, event.message)
      conversation.type !== "u" && deliverMessage.addPushQueueMessage(event.notification)
      response.addDeliverMessage(deliverMessage)
    }

    return response
  }

  async update(ws, data) {
    const { id: requestId, conversation_update: conversationParams } = data

    const response = new Response()

    const conversationEditOperation = ServiceLocatorContainer.use("ConversationEditOperation")
    const updatedConversationResult = await conversationEditOperation.perform(ws, conversationParams)

    if (!updatedConversationResult) {
      return response.addBackMessage({
        response: {
          id: requestId,
          deleted: true,
        },
      })
    }

    const { currentUserId, conversation, conversationEvents = [] } = updatedConversationResult

    conversationEvents.forEach((event) => {
      const deliverMessage = new DeliverMessage(event.participantIds, event.message).addPushQueueMessage(
        event.notification
      )
      response.addDeliverMessage(deliverMessage)

      const isCurrentUser = event.participantIds.find((pId) =>
        conversationEditOperation.helpers.isEqualsNativeIds(pId, currentUserId)
      )
      if (isCurrentUser && !event.ignoreOwnDelivery) {
        response.addBackMessage(event.message)
      }
    })

    return response.addBackMessage({
      response: {
        id: requestId,
        conversation: conversation.visibleParams(),
      },
    })
  }

  async list(ws, data) {
    const { id: requestId, conversation_list: conversationListOptions } = data

    const conversationListOperation = ServiceLocatorContainer.use("ConversationListOperation")
    const conversations = await conversationListOperation.perform(ws, conversationListOptions)

    return new Response().addBackMessage({
      response: {
        id: requestId,
        conversations: conversations,
      },
    })
  }

  async delete(ws, data) {
    const {
      id: requestId,
      conversation_delete: { id: conversationId },
    } = data

    const response = new Response()

    const conversationDeleteOperation = ServiceLocatorContainer.use("ConversationDeleteOperation")
    const deletedConversationResult = await conversationDeleteOperation.perform(ws, conversationId)

    const { currentUserId, conversationEvents = [] } = deletedConversationResult

    conversationEvents.forEach((event) => {
      const deliverMessage = new DeliverMessage(event.participantIds, event.message).addPushQueueMessage(
        event.notification
      )
      response.addDeliverMessage(deliverMessage)

      const isCurrentUser = event.participantIds.find((pId) =>
        conversationDeleteOperation.helpers.isEqualsNativeIds(pId, currentUserId)
      )
      if (isCurrentUser) {
        response.addBackMessage(event.message)
      }
    })

    return response.addBackMessage({
      response: {
        id: requestId,
        success: true,
      },
    })
  }

  async get_participants_by_cids(ws, data) {
    const { id: requestId, get_participants_by_cids: options } = data

    const conversationListParticipantsOperation = ServiceLocatorContainer.use("ConversationListParticipantsOperation")
    const { users, conversations } = await conversationListParticipantsOperation.perform(ws, options)

    return new Response().addBackMessage({
      response: { id: requestId, users, conversations },
    })
  }

  async search(ws, data) {
    const { id: requestId, conversation_search: searchParams } = data

    const conversationSearchOperation = ServiceLocatorContainer.use("ConversationSearchOperation")
    const conversationsSearchOperation = await conversationSearchOperation.perform(ws, searchParams)

    return new Response().addBackMessage({ response: { id: requestId, conversations: conversationsSearchOperation } })
  }
}

export default new ConversationsController()
