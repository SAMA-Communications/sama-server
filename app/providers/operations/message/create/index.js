import { ERROR_STATUES } from '../../../../constants/errors.js'
import { CONVERSATION_EVENTS } from '../../../../constants/conversation.js'
import CreateChatAlertEventOptions from '@sama/lib/push_queue/models/CreateChatAlertEventOptions.js'


class MessageCreateOperation {
  constructor(
    sessionService,
    storageService,
    blockListRepo,
    userService,
    conversationService,
    conversationNotificationService,
    messageService,
    conversationMapper,
    messageMapper
  ) {
    this.sessionService = sessionService
    this.storageService = storageService
    this.blockListRepo = blockListRepo
    this.userService = userService
    this.conversationService = conversationService
    this.conversationNotificationService = conversationNotificationService
    this.messageService = messageService
    this.conversationMapper = conversationMapper
    this.messageMapper = messageMapper
  }

  async perform(ws, createMessageParams) {
    const deliverMessages = []

    const messageId = createMessageParams.id
    delete createMessageParams.id

    const currentUserId = this.sessionService.getSessionUserId(ws)

    const { conversation, blockedUserIds, participantIds } = await this.#hashAccess(createMessageParams.cid, currentUserId)

    const message = await this.messageService.create(currentUserId, blockedUserIds, createMessageParams)

    if (conversation.type === 'u') {
      const missedParticipantIds = await this.conversationService.restorePrivateConversation(conversation, participantIds)
      if (missedParticipantIds.length) {
        participantIds.push(...missedParticipantIds)

        const restoreConversationEvent = await this.#restorePrivateConversationNotification(conversation, currentUserId)
        restoreConversationEvent.participantIds = missedParticipantIds
        deliverMessages.push(restoreConversationEvent)
      }
    }

    const deliverCreatedMessage = await this.#createMessageNotification(conversation, message)
    deliverMessages.push(deliverCreatedMessage)
    
    await this.conversationService.conversationRepo.updateLastActivity(conversation._id, message.created_at)

    return { messageId, message: message, deliverMessages, participantIds }
  }

  async #hashAccess(conversationId, currentUserId) {
    const { conversation, participantIds } = await this.#hashAccessToConversation(conversationId, currentUserId)

    const blockedUserIds = await this.#checkBlocked(conversation, currentUserId, participantIds)

    return { conversation, blockedUserIds, participantIds }
  }

  async #hashAccessToConversation(conversationId, currentUserId) {
    const { conversation, asParticipant, participantIds } = await this.conversationService.hashAccessToConversation(conversationId, currentUserId)

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
    const stringParticipantIds = participantIds.map(pId => pId.toString())

    const userIdsWhoBlockedCurrentUser = await this.blockListRepo.getBlockingUsers(currentUserId, stringParticipantIds)

    if (conversation.type === 'u' && userIdsWhoBlockedCurrentUser.length) {
      throw new Error(ERROR_STATUES.USER_BLOCKED.message, {
        cause: ERROR_STATUES.USER_BLOCKED,
      })
    }

    const isAllBlocked = userIdsWhoBlockedCurrentUser.length === participantIds.length - 1
    if (conversation.type === 'g' && isAllBlocked) {
      throw new Error(ERROR_STATUES.USER_BLOCKED_FOR_ALL_PARTICIPANTS.message, {
        cause: ERROR_STATUES.USER_BLOCKED_FOR_ALL_PARTICIPANTS,
      })
    }

    return userIdsWhoBlockedCurrentUser
  }

  async #createMessageNotification(conversation, message) {
    const user = await this.userService.userRepo.findById(message.from)
    const userLogin = user.login

    const firstAttachmentUrl = !message.attachments?.length ? null : await this.storageService.getDownloadUrl(message.attachments[0].file_id)

    const pushPayload = Object.assign({
      title: conversation.type === 'u' ? userLogin : `${userLogin} | ${conversation.name}`,
      body: message.body,
      firstAttachmentUrl,
      cid: message.cid,
    })
    
    const createChatAlertEventOptions = new CreateChatAlertEventOptions({
      conversationId: conversation._id,
      messageId: message._id,
      senderID: message.from,
    }, pushPayload)

    const createdMessage = { message: message.visibleParams() }

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
