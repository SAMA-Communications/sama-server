import { ERROR_STATUES } from '../../../../constants/errors.js'
import { CONVERSATION_EVENTS } from '../../../../constants/conversation.js'
import MessagePublicFields from '@sama/DTO/Response/message/create/public_fields.js'

class ConversationEditOperation {
  constructor(
    sessionService,
    userService,
    conversationService,
    conversationNotificationService,
    messagesService
  ) {
    this.sessionService = sessionService
    this.userService = userService
    this.conversationService = conversationService
    this.conversationNotificationService = conversationNotificationService,
    this.messagesService = messagesService
  }

  async perform(ws, conversationParams) {
    const { id: conversationId, participants: updateParticipants, ...updateFields } = conversationParams

    let conversationEvents = []
    
    const currentUserId = this.sessionService.getSessionUserId(ws)
    
    const { participantIds: currentParticipantIds } = await this.#hasAccess(conversationId, currentUserId)

    const updatedConversation = await this.conversationService.conversationRepo.update(conversationId, updateFields)

    if (updateParticipants && updatedConversation.type !== 'u') {
      const { isEmptyAndDeleted, addedIds, removedIds, currentIds }  = await this.#updateParticipants(
        updatedConversation,
        updateParticipants,
        currentParticipantIds
      )

      if (isEmptyAndDeleted) {
        return null
      }

      const createdEvents = await this.#createActionEvents(updatedConversation, currentUserId, addedIds, removedIds, currentIds)
      conversationEvents = createdEvents
    }

    return { currentUserId, conversation: updatedConversation, conversationEvents }
  }

  async #hasAccess(conversationId, userId) {
    const { conversation, asOwner, participantIds } = await this.conversationService.hasAccessToConversation(conversationId, userId)
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

  async #addMessagesInfo(conversation, user) {
    const lastMessagesListByCid = await this.messagesService.aggregateLastMessageForConversation([conversation._id], user)

    const conversationId = conversation._id.toString()
    const lastMessage = lastMessagesListByCid[conversationId]
    const lastMessageVal = lastMessage ? new MessagePublicFields(lastMessage) : void 0

    conversation.set('last_message', lastMessageVal)
    conversation.set('unread_messages_count', 1)

    return conversation
  }

  async #createActionEvents(conversation, currentUserId, addedParticipantIds, removedParticipantIds, currentParticipantIds) {
    const currentUser = await this.userService.userRepo.findById(currentUserId)

    const conversationEvent = []

    if (addedParticipantIds.length) {
      for (const addedParticipantId of addedParticipantIds) {
        const addParticipantEvent = await this.#participantsActionEvent(conversation, currentUser, addedParticipantId, false)
  
        addParticipantEvent.participantIds = currentParticipantIds
  
        conversationEvent.push(addParticipantEvent)
      }

      await this.#addMessagesInfo(conversation, currentUser)
      const updateEvent = await this.#actionEvent(conversation, currentUser, false)
      updateEvent.participantIds = addedParticipantIds
  
      conversationEvent.push(updateEvent)
    }

    if (removedParticipantIds.length) {
      for (const removedParticipantId of removedParticipantIds) {
        const removedParticipantEvent = await this.#participantsActionEvent(conversation, currentUser, removedParticipantId, true)
  
        removedParticipantEvent.participantIds = currentParticipantIds
  
        conversationEvent.push(removedParticipantEvent)
      }

      const deleteEvent = await this.#actionEvent(conversation, currentUser, true)
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
