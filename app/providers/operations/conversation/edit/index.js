import { ERROR_STATUES } from '../../../../constants/errors.js'
import { CONVERSATION_EVENTS } from '../../../../constants/conversation.js'

class ConversationEditOperation {
  constructor(
    sessionService,
    userService,
    conversationService,
    conversationNotificationService,
    conversationMapper
  ) {
    this.sessionService = sessionService
    this.userService = userService
    this.conversationService = conversationService
    this.conversationNotificationService = conversationNotificationService
    this.conversationMapper = conversationMapper
  }

  async perform(ws, conversationParams) {
    const conversationId = conversationParams.id
    delete conversationParams.id

    let conversationEvents = []
    
    const currentUserId = this.sessionService.getSessionUserId(ws)
    
    const { conversation, participantIds: currentParticipantIds } = await this.#hasAccess(conversationId, currentUserId)

    if (conversationParams.participants) {
      const { isEmptyAndDeleted, addedIds, removedIds, currentIds }  = await this.#updateParticipants(
        conversation,
        conversationParams.participants,
        currentParticipantIds
      )

      if (isEmptyAndDeleted) {
        return null
      }

      const createdEvents = await this.#createActionEvents(conversation, currentUserId, addedIds, removedIds, currentIds)
      conversationEvents = createdEvents
    }
    delete conversationParams.participants

    const updatedConversation = await this.conversationService.conversationRepo.update(conversationId, conversationParams)

    return { conversation: await this.conversationMapper(updatedConversation), conversationEvents }
  }

  async #hasAccess(conversationId, userId) {
    const { conversation, asOwner, participantIds } = await this.conversationService.hashAccessToConversation(conversationId, userId)
    if (!conversation) {
      throw new Error(ERROR_STATUES.BAD_REQUEST.message, {
        cause: ERROR_STATUES.BAD_REQUEST,
      })
    }

    if (!asOwner) {
      throw new Error(ERROR_STATUES.FORBIDDEN.message, {
        cause: ERROR_STATUES.FORBIDDEN,
      })
    }

    return { conversation, participantIds }
  }

  async #updateParticipants(conversation, updateParticipants, currentParticipantIds) {
    let { add: addUsers, remove: removeUsers } = updateParticipants

    if (addUsers?.length) {
      addUsers = await this.userService.userRepo.retrieveExistedIds(addUsers)
    }

    if (removeUsers?.length) {
      removeUsers = await this.userService.userRepo.retrieveExistedIds(removeUsers)
    }

    addUsers ??= []
    removeUsers ??= []

    const result = await this.conversationService.updateParticipants(conversation, addUsers, removeUsers, currentParticipantIds)

    return result
  }

  async #createActionEvents(conversation, currentUserId, addedParticipantIds, removedParticipantIds, currentParticipantIds) {
    const currentUser = await this.userService.userRepo.findById(currentUserId)

    const mappedConversation = await this.conversationMapper(conversation)

    const conversationEvent = []

    if (addedParticipantIds.length) {
      for (const addedParticipantId of addedParticipantIds) {
        const addParticipantEvent = await this.#participantsActionEvent(mappedConversation, currentUser, addedParticipantId, false)
  
        addParticipantEvent.participantIds = currentParticipantIds
  
        conversationEvent.push(addParticipantEvent)
      }

      const updateEvent = await this.#actionEvent(mappedConversation, currentUser, false)
      updateEvent.participantIds = addedParticipantIds
  
      conversationEvent.push(updateEvent)
    }

    if (removedParticipantIds.length) {
      for (const removedParticipantId of removedParticipantIds) {
        const removedParticipantEvent = await this.#participantsActionEvent(mappedConversation, currentUser, removedParticipantId, true)
  
        removedParticipantEvent.participantIds = currentParticipantIds
  
        conversationEvent.push(removedParticipantEvent)
      }

      const deleteEvent = await this.#actionEvent(mappedConversation, currentUser, true)
      deleteEvent.participantIds = removedParticipantIds

      conversationEvent.push(deleteEvent)
    }

    return conversationEvent
  }

  async #actionEvent(conversation, currentUser, isDelete) {
    const eventType = isDelete ? CONVERSATION_EVENTS.CONVERSATION_EVENT.DELETE : CONVERSATION_EVENTS.CONVERSATION_EVENT.UPDATE

    const actionMessageNotification = await this.conversationNotificationService.actionEvent(
      eventType,
      conversation,
      currentUser
    )

    return actionMessageNotification
  }

  async #participantsActionEvent(conversation, currentUser, actionedUserId, isRemove) {
    const eventType = isRemove ? CONVERSATION_EVENTS.CONVERSATION_PARTICIPANT_EVENT.REMOVED : CONVERSATION_EVENTS.CONVERSATION_PARTICIPANT_EVENT.ADDED

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

export default ConversationEditOperation
