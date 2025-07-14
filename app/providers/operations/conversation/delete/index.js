import { ERROR_STATUES } from "../../../../constants/errors.js"
import { CONVERSATION_EVENTS } from "../../../../constants/conversation.js"

class ConversationDeleteOperation {
  constructor(helpers, sessionService, userService, conversationService, conversationNotificationService) {
    this.helpers = helpers
    this.sessionService = sessionService
    this.userService = userService
    this.conversationService = conversationService
    this.conversationNotificationService = conversationNotificationService
  }

  async perform(ws, conversationId) {
    const { userId: currentUserId, organizationId } = this.sessionService.getSession(ws)

    const { conversation } = await this.#getConversationDetails(
      organizationId,
      conversationId,
      currentUserId
    )

    await this.conversationService.removeParticipants(conversation, [currentUserId])

    const result = { organizationId, currentUserId }

    if (this.conversationNotificationService.isEnabled()) {
      const conversationEvents = await this.#createActionEvents(conversation, currentUserId)
      conversationEvents.forEach((conversationEvent) => {
        conversationEvent.cId = conversation._id
        conversationEvent.participantIds = conversation.type === "u" ? [conversation.opponent_id] : null
      })

      result.conversationEvents = conversationEvents
    }

    return result
  }

  async #getConversationDetails(organizationId, conversationId, userId) {
    const { conversation, asParticipant } = await this.conversationService.hasAccessToConversation(
      organizationId,
      conversationId,
      userId
    )
    if (!conversation) {
      throw new Error(ERROR_STATUES.BAD_REQUEST.message, {
        cause: ERROR_STATUES.BAD_REQUEST,
      })
    }

    if (!asParticipant) {
      throw new Error(ERROR_STATUES.PARTICIPANT_NOT_FOUND.message, {
        cause: ERROR_STATUES.PARTICIPANT_NOT_FOUND,
      })
    }

    return { conversation }
  }

  async #createActionEvents(conversation, currentUserId) {
    const currentUser = await this.userService.userRepo.findById(currentUserId)

    const conversationEvent = []

    const leftParticipantEvent = await this.#participantsActionEvent(conversation, currentUser, currentUserId)

    conversationEvent.push(leftParticipantEvent)

    return conversationEvent
  }

  async #participantsActionEvent(conversation, currentUser, actionedUserId) {
    const eventType = CONVERSATION_EVENTS.CONVERSATION_PARTICIPANT_EVENT.LEFT

    const actionedUser = await this.userService.userRepo.findById(actionedUserId)

    const actionMessageNotification = await this.conversationNotificationService.participantActionEvent(
      eventType,
      conversation,
      currentUser,
      actionedUser
    )

    return actionMessageNotification
  }
}

export default ConversationDeleteOperation
