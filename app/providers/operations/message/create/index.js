import { ERROR_STATUES } from "../../../../constants/errors.js"
import { CONVERSATION_EVENTS } from "../../../../constants/conversation.js"
import CreateChatAlertEventOptions from "@sama/providers/services/push_queue_service/models/CreateChatAlertEventOptions.js"
import MessagePublicFields from "@sama/DTO/Response/message/create/public_fields.js"

class MessageCreateOperation {
  constructor(
    sessionService,
    storageService,
    blockListService,
    userService,
    conversationService,
    conversationNotificationService,
    messageService
  ) {
    this.sessionService = sessionService
    this.storageService = storageService
    this.blockListService = blockListService
    this.userService = userService
    this.conversationService = conversationService
    this.conversationNotificationService = conversationNotificationService
    this.messageService = messageService
  }

  async perform(ws, createMessageParams) {
    const deliverMessages = []

    const messageId = createMessageParams.id
    delete createMessageParams.id

    const { userId: currentUserId, organizationId } = this.sessionService.getSession(ws)
    const currentUser = await this.userService.userRepo.findById(currentUserId)
    const { conversation, blockedUserIds, participantIds } = await this.#hasAccess(
      createMessageParams.cid,
      currentUserId,
      organizationId
    )

    const message = await this.messageService.create(currentUser, conversation, blockedUserIds, createMessageParams)

    if (!message.x) {
      message.set("x", {})
    }

    message.x.c_type = conversation.type

    if (conversation.type === "u") {
      const missedParticipantIds = await this.conversationService.restorePrivateConversation(
        conversation,
        participantIds
      )
      if (missedParticipantIds.length) {
        participantIds.push(...missedParticipantIds)

        if (this.conversationNotificationService.isEnabled()) {
          const restoreConversationEvent = await this.#restorePrivateConversationNotification(
            conversation,
            currentUserId
          )
          restoreConversationEvent.participantIds = missedParticipantIds
          deliverMessages.push(restoreConversationEvent)
        }
      }
    }

    const deliverCreatedMessage = await this.#createMessageNotification(conversation, currentUser, message)
    deliverMessages.push(deliverCreatedMessage)

    await this.conversationService.conversationRepo.updateLastActivity(conversation._id, message.created_at)

    return { messageId, message: message, deliverMessages, participantIds }
  }

  async #hasAccess(conversationId, currentUserId, organizationId) {
    const { conversation, participantIds } = await this.#hasAccessToConversation(
      conversationId,
      currentUserId,
      organizationId
    )

    const blockedUserIds = await this.#checkBlocked(conversation, currentUserId, participantIds)

    return { conversation, blockedUserIds, participantIds }
  }

  async #hasAccessToConversation(conversationId, currentUserId, organizationId) {
    const { conversation, asParticipant, participantIds } = await this.conversationService.hasAccessToConversation(
      conversationId,
      currentUserId,
      organizationId
    )

    if (!conversation) {
      throw new Error(ERROR_STATUES.CONVERSATION_NOT_FOUND.message, {
        cause: ERROR_STATUES.CONVERSATION_NOT_FOUND,
      })
    }

    if (!asParticipant) {
      throw new Error(ERROR_STATUES.FORBIDDEN.message, {
        cause: ERROR_STATUES.FORBIDDEN,
      })
    }

    return { conversation, participantIds }
  }

  async #checkBlocked(conversation, currentUserId, participantIds) {
    const blockedUserIds = await this.blockListService.listMutualBlockedIds(currentUserId, participantIds)

    if (conversation.type === "u" && blockedUserIds.length) {
      throw new Error(ERROR_STATUES.USER_BLOCKED.message, {
        cause: ERROR_STATUES.USER_BLOCKED,
      })
    }

    return blockedUserIds
  }

  async #createMessageNotification(conversation, user, message) {
    const userLogin = user.login

    const firstAttachmentUrl = !message.attachments?.length
      ? null
      : await this.storageService.getDownloadUrl(message.attachments[0].file_id)

    const pushPayload = Object.assign({
      title: conversation.type === "u" ? userLogin : `${userLogin} | ${conversation.name}`,
      body: message.body,
      firstAttachmentUrl,
      cid: message.cid,
    })

    const createChatAlertEventOptions = new CreateChatAlertEventOptions(
      {
        conversationId: conversation._id,
        messageId: message._id,
        senderID: message.from,
      },
      pushPayload
    )

    const createdMessage = new MessagePublicFields(message)

    const createMessageEvent = { message: createdMessage, notification: createChatAlertEventOptions }

    return createMessageEvent
  }

  async #restorePrivateConversationNotification(conversation, currentUserId) {
    const user = await this.userService.userRepo.findById(currentUserId)

    const event = await this.conversationNotificationService.actionEvent(
      CONVERSATION_EVENTS.CONVERSATION_EVENT.CREATE,
      conversation,
      user
    )

    return event
  }
}

export default MessageCreateOperation
