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
    conversationHandlerService,
    conversationNotificationService,
    messageService
  ) {
    this.sessionService = sessionService
    this.storageService = storageService
    this.blockListService = blockListService
    this.userService = userService
    this.conversationService = conversationService
    this.conversationHandlerService = conversationHandlerService
    this.conversationNotificationService = conversationNotificationService
    this.messageService = messageService
  }

  async perform(ws, createMessageParams) {
    const deliverMessages = []
    let modifiedFields = null
    let botMessage = null

    const messageId = createMessageParams.id
    delete createMessageParams.id

    const { userId: currentUserId, organizationId } = this.sessionService.getSession(ws)
    const currentUser = await this.userService.userRepo.findById(currentUserId)
    const conversation = await this.#hasAccess(organizationId, createMessageParams.cid, currentUserId)

    let conversationHandlerResponse = {}
    const conversationHandler = await this.conversationHandlerService.getHandlerByConversationId(conversation._id)
    if (conversationHandler) {
      const {
        accept,
        message: newMessage,
        options,
      } = await this.conversationHandlerService.prepareAndExecuteConversationHandler(
        conversationHandler.content,
        createMessageParams,
        currentUser
      )

      conversationHandlerResponse = await this.messageService.processHandlerResult(
        currentUser.organization_id,
        accept,
        createMessageParams,
        newMessage,
        options
      )

      if (conversationHandlerResponse.newMessageFields) {
        const { newMessageFields } = conversationHandlerResponse
        modifiedFields = newMessageFields
        for (const field in newMessageFields) {
          createMessageParams[field] = newMessageFields[field]
        }
      }
    }

    const message = await this.messageService.create(currentUser, conversation, createMessageParams)

    if (!message.x) message.set("x", {})
    message.x.c_type = conversation.type

    if (conversation.type === "u") {
      const missedParticipantIds = await this.conversationService.restorePrivateConversation(conversation)

      if (missedParticipantIds.length) {
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

    if (conversationHandlerResponse.botMessageParams && conversationHandlerResponse.serverBot) {
      const { botMessageParams, serverBot } = conversationHandlerResponse

      botMessage = await this.messageService.create(serverBot, conversation, botMessageParams)

      if (!botMessage.x) botMessage.set("x", {})
      botMessage.x.c_type = conversation.type

      const deliverBotMessage = await this.#createMessageNotification(conversation, serverBot, botMessageParams)
      deliverBotMessage.message = { ...deliverBotMessage.message, _id: botMessage._id }
      deliverMessages.push(deliverBotMessage)
    }

    await this.conversationService.conversationRepo.updateLastActivity(conversation._id, message.created_at)

    const participantIds = conversation.type === "u" ? [conversation.owner_id, conversation.opponent_id] : null

    return {
      organizationId,
      messageId,
      message,
      deliverMessages,
      cId: conversation._id,
      participantIds,
      modifiedFields,
      botMessage,
    }
  }

  async #hasAccess(organizationId, conversationId, currentUserId) {
    const conversation = await this.#hasAccessToConversation(organizationId, conversationId, currentUserId)

    if (conversation.type === "u") {
      const privateParticipantsIds = [conversation.owner_id, conversation.opponent_id]
      await this.#checkBlocked(conversation, currentUserId, privateParticipantsIds)
    }

    return conversation
  }

  async #hasAccessToConversation(organizationId, conversationId, currentUserId) {
    const { conversation, asOwner, asAdmin, asParticipant } = await this.conversationService.hasAccessToConversation(
      organizationId,
      conversationId,
      currentUserId
    )

    if (!conversation) {
      throw new Error(ERROR_STATUES.CONVERSATION_NOT_FOUND.message, {
        cause: ERROR_STATUES.CONVERSATION_NOT_FOUND,
      })
    }

    if (conversation.type === "c" && !(asOwner || asAdmin)) {
      throw new Error(ERROR_STATUES.FORBIDDEN.message, {
        cause: ERROR_STATUES.FORBIDDEN,
      })
    }

    if (!asParticipant) {
      throw new Error(ERROR_STATUES.FORBIDDEN.message, {
        cause: ERROR_STATUES.FORBIDDEN,
      })
    }

    return conversation
  }

  async #checkBlocked(conversation, currentUserId, participantIds) {
    const blockedUserIds = await this.blockListService.listMutualBlockedIds(currentUserId, participantIds)

    if (conversation.type === "u" && blockedUserIds.length) {
      throw new Error(ERROR_STATUES.USER_BLOCKED.message, {
        cause: ERROR_STATUES.USER_BLOCKED,
      })
    }
  }

  async #createMessageNotification(conversation, user, message) {
    const userLogin = user.login

    const firstAttachmentUrl = !message.attachments?.length
      ? null
      : message.attachments[0]?.file_id && (await this.storageService.getDownloadUrl(message.attachments[0].file_id))

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
