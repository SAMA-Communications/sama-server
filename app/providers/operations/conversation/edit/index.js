import { ERROR_STATUES } from "../../../../constants/errors.js"
import { CONVERSATION_EVENTS } from "../../../../constants/conversation.js"
import MessagePublicFields from "@sama/DTO/Response/message/create/public_fields.js"

class ConversationEditOperation {
  constructor(
    helpers,
    sessionService,
    userService,
    conversationService,
    conversationNotificationService,
    messagesService
  ) {
    this.helpers = helpers
    this.sessionService = sessionService
    this.userService = userService
    this.conversationService = conversationService
    this.conversationNotificationService = conversationNotificationService
    this.messagesService = messagesService
  }

  async perform(ws, conversationParams) {
    const { id: conversationId, admins: updateAdmins, participants: updateParticipants, ...updateFields } = conversationParams

    const { userId: currentUserId, organizationId } = this.sessionService.getSession(ws)

    const { participantIds: currentParticipantIds } = await this.#hasAccess(
      organizationId,
      conversationId,
      currentUserId
    )

    const updatedConversation = await this.conversationService.conversationRepo.update(conversationId, updateFields)

    const result = { currentUserId, conversation: updatedConversation }

    if (updatedConversation.type === "u") {
      return result
    }

    if (updateAdmins) {
      const addedAdminParticipants = await this.#updateAdmins(
        updatedConversation,
        updateAdmins,
        currentParticipantIds
      )

      currentParticipantIds.push(...addedAdminParticipants)
    }

    if (updateParticipants) {
      const { isEmptyAndDeleted, addedIds, removedIds, currentIds } = await this.#updateParticipants(
        updatedConversation,
        updateParticipants,
        currentParticipantIds
      )

      if (isEmptyAndDeleted) {
        return null
      }

      if (!this.conversationNotificationService.isEnabled()) {
        return result
      }

      const isUpdateConversationFields = !!Object.keys(updateFields).length
      const isUpdateConversationImage = !!updateFields.image_object
      const updatedConversationWithImageUrl = await this.conversationService.addImageUrl([updatedConversation])

      const createdEvents = await this.#createActionEvents(
        updatedConversationWithImageUrl.at(0),
        currentUserId,
        addedIds,
        removedIds,
        currentIds,
        isUpdateConversationFields,
        isUpdateConversationImage
      )

      result.conversationEvents = createdEvents
    }

    return result
  }

  async #hasAccess(organizationId, conversationId, userId) {
    const { conversation, asOwner, asAdmin, participantIds } = await this.conversationService.hasAccessToConversation(
      organizationId,
      conversationId,
      userId
    )

    if (!conversation) {
      throw new Error(ERROR_STATUES.BAD_REQUEST.message, {
        cause: ERROR_STATUES.BAD_REQUEST,
      })
    }

    if (!(asOwner || asAdmin)) {
      throw new Error(ERROR_STATUES.FORBIDDEN.message, {
        cause: ERROR_STATUES.FORBIDDEN,
      })
    }

    return { conversation, participantIds }
  }

  async #updateAdmins(conversation, updateAdmins, currentParticipantIds) {
    let { add: addAdmins, remove: removeAdmins } = updateAdmins

    let addedParticipantsIds = []

    if (addAdmins?.length) {
      addAdmins = await this.userService.userRepo.retrieveExistedIds(conversation.organization_id, addAdmins)

      if (addAdmins.length) {
        addedParticipantsIds = await this.conversationService.addParticipants(conversation, addAdmins, currentParticipantIds)

        await this.conversationService.participantsAddAdminRole(conversation._id, addAdmins)
      }
    }

    if (removeAdmins?.length) {
      await this.conversationService.participantsRemoveAdminRole(conversation._id, removeAdmins)
    }

    return addedParticipantsIds
  }

  async #updateParticipants(conversation, updateParticipants, currentParticipantIds) {
    let { add: addParticipants, remove: removeParticipants } = updateParticipants

    if (addParticipants?.length) {
      addParticipants = await this.userService.userRepo.retrieveExistedIds(conversation.organization_id, addParticipants)
    }

    if (removeParticipants?.length) {
      removeParticipants = await this.userService.userRepo.retrieveExistedIds(conversation.organization_id, removeParticipants)
    }

    addParticipants ??= []
    removeParticipants ??= []

    const result = await this.conversationService.updateParticipants(
      conversation,
      addParticipants,
      removeParticipants,
      currentParticipantIds
    )

    return result
  }

  async #addMessagesInfo(conversation, user) {
    const lastMessagesListByCid = await this.messagesService.aggregateLastMessageForConversation(
      [conversation._id],
      user
    )

    const conversationId = conversation._id.toString()
    const lastMessage = lastMessagesListByCid[conversationId]
    const lastMessageVal = lastMessage ? new MessagePublicFields(lastMessage) : void 0

    conversation.set("last_message", lastMessageVal)
    conversation.set("unread_messages_count", 1)

    return conversation
  }

  async #createActionEvents(
    conversation,
    currentUserId,
    addedParticipantIds,
    removedParticipantIds,
    currentParticipantIds,
    isUpdateConversation,
    isUpdateConversationImage
  ) {
    const currentUser = await this.userService.userRepo.findById(currentUserId)

    const conversationEvent = []

    if (addedParticipantIds.length) {
      for (const addedParticipantId of addedParticipantIds) {
        const addParticipantEvent = await this.#participantsActionEvent(
          conversation,
          currentUser,
          addedParticipantId,
          false
        )

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
        const removedParticipantEvent = await this.#participantsActionEvent(
          conversation,
          currentUser,
          removedParticipantId,
          true
        )

        removedParticipantEvent.participantIds = currentParticipantIds

        conversationEvent.push(removedParticipantEvent)
      }

      const deleteEvent = await this.#actionEvent(conversation, currentUser, true)
      deleteEvent.participantIds = removedParticipantIds

      conversationEvent.push(deleteEvent)
    }

    if (isUpdateConversation) {
      const updatedEvent = await this.#actionEvent(conversation, currentUser, false)

      updatedEvent.participantIds = currentParticipantIds
      conversationEvent.push({ ...updatedEvent, ignoreOwnDelivery: true })
    }

    if (isUpdateConversationImage) {
      const updatedEvent = await this.#imageActionEvent(conversation, currentUser)

      updatedEvent.participantIds = currentParticipantIds
      conversationEvent.push({ ...updatedEvent, ignoreOwnDelivery: false })
    }

    return conversationEvent
  }

  async #actionEvent(conversation, currentUser, isDelete) {
    const eventType = isDelete
      ? CONVERSATION_EVENTS.CONVERSATION_EVENT.DELETE
      : CONVERSATION_EVENTS.CONVERSATION_EVENT.UPDATE

    const actionMessageNotification = await this.conversationNotificationService.actionEvent(
      eventType,
      conversation,
      currentUser
    )

    return actionMessageNotification
  }

  async #imageActionEvent(conversation, currentUser) {
    const eventType = CONVERSATION_EVENTS.CONVERSATION_EVENT.UPDATE_IMAGE

    const actionMessageNotification = await this.conversationNotificationService.imageActionEvent(
      eventType,
      conversation,
      currentUser
    )

    return actionMessageNotification
  }

  async #participantsActionEvent(conversation, currentUser, actionedUserId, isRemove) {
    const eventType = isRemove
      ? CONVERSATION_EVENTS.CONVERSATION_PARTICIPANT_EVENT.REMOVED
      : CONVERSATION_EVENTS.CONVERSATION_PARTICIPANT_EVENT.ADDED

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
