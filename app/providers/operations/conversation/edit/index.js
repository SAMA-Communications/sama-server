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
    const { id: conversationId, admins: updateAdmins, ...updateFields } = conversationParams
    let { participants: updateParticipants } = conversationParams

    const { userId: currentUserId, organizationId } = this.sessionService.getSession(ws)

    await this.#hasAccess(organizationId, conversationId, currentUserId)

    const updatedConversation = await this.conversationService.conversationRepo.update(conversationId, updateFields)

    const result = { organizationId, currentUserId, conversation: updatedConversation }

    if (updatedConversation.type === "u") {
      return result
    }

    const adminsToAdd = updateAdmins?.add?.length
      ? await this.#prepareAddAdmins(updatedConversation, updateAdmins.add)
      : []

    if (adminsToAdd.length) {
      if (!updateParticipants) {
        updateParticipants = { add: [] }
      }

      updateParticipants.add = (updateParticipants.add ?? []).concat(adminsToAdd)
    }

    let updateParticipantsResult = {}
    if (updateParticipants) {
      updateParticipantsResult = await this.#updateParticipants(updatedConversation, updateParticipants)
    }

    const { isEmptyAndDeleted, addedIds, removedIds } = updateParticipantsResult

    if (isEmptyAndDeleted) {
      return null
    }

    if (updateAdmins) {
      await this.#updateAdmins(updatedConversation, updateAdmins)
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
      isUpdateConversationFields,
      isUpdateConversationImage
    )

    createdEvents.forEach((event) => {
      event.cId = updatedConversation._id
    })

    result.conversationEvents = createdEvents

    return result
  }

  async #hasAccess(organizationId, conversationId, userId) {
    const { conversation, asOwner, asAdmin } = await this.conversationService.hasAccessToConversation(
      organizationId,
      conversationId,
      userId
    )

    if (!conversation) {
      throw new Error(ERROR_STATUES.BAD_REQUEST.message, {
        cause: ERROR_STATUES.BAD_REQUEST,
      })
    }

    if (conversation.type !== "u" && !(asOwner || asAdmin)) {
      throw new Error(ERROR_STATUES.FORBIDDEN.message, {
        cause: ERROR_STATUES.FORBIDDEN,
      })
    }

    return { conversation }
  }

  async #prepareAddAdmins(conversation, addAdmins) {
    addAdmins = await this.userService.userRepo.retrieveExistedIds(conversation.organization_id, addAdmins)

    return addAdmins
  }

  async #updateAdmins(conversation, updateAdmins) {
    const { add: addAdmins, remove: removeAdmins } = updateAdmins

    if (addAdmins?.length) {
      await this.conversationService.participantsAddAdminRole(conversation._id, addAdmins)
    }

    if (removeAdmins?.length) {
      await this.conversationService.participantsRemoveAdminRole(conversation._id, removeAdmins)
    }
  }

  async #updateParticipants(conversation, updateParticipants) {
    let { add: addParticipants, remove: removeParticipants } = updateParticipants

    if (addParticipants?.length) {
      addParticipants = await this.userService.userRepo.retrieveExistedIds(
        conversation.organization_id,
        addParticipants
      )
    }

    if (removeParticipants?.length) {
      removeParticipants = await this.userService.userRepo.retrieveExistedIds(
        conversation.organization_id,
        removeParticipants
      )
    }

    addParticipants ??= []
    removeParticipants ??= []

    const result = await this.conversationService.updateParticipants(conversation, addParticipants, removeParticipants)

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

        conversationEvent.push(removedParticipantEvent)
      }

      const deleteEvent = await this.#actionEvent(conversation, currentUser, true)
      deleteEvent.participantIds = removedParticipantIds

      conversationEvent.push(deleteEvent)
    }

    if (isUpdateConversation) {
      const updatedEvent = await this.#actionEvent(conversation, currentUser, false)

      conversationEvent.push({ ...updatedEvent, ignoreOwnDelivery: true })
    }

    if (isUpdateConversationImage) {
      const updatedEvent = await this.#imageActionEvent(conversation, currentUser)

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
