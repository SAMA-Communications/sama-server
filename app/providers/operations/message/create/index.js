import { ERROR_STATUES } from '../../../../constants/errors.js'

import CreateChatAlertEventOptions from '@sama/lib/push_queue/models/CreateChatAlertEventOptions.js'
import DeliverMessage from '@sama/networking/models/DeliverMessage.js'

class MessageCreateOperation {
  constructor(
    sessionService,
    storageService,
    blockListRepo,
    userService,
    conversationService,
    messageService,
    conversationMapper,
    messageMapper
  ) {
    this.sessionService = sessionService
    this.storageService = storageService
    this.blockListRepo = blockListRepo
    this.userService = userService
    this.conversationService = conversationService
    this.messageService = messageService
    this.conversationMapper = conversationMapper
    this.messageMapper = messageMapper
  }

  async perform(ws, createMessageParams) {
    const messageId = createMessageParams.id
    delete createMessageParams.id

    const deliverMessages = []

    const currentUserId = this.sessionService.getSessionUserId(ws)

    const { conversation, blockedUserIds, participantIds } = await this.#hashAccess(createMessageParams.cid, currentUserId)

    const message = await this.messageService.create(currentUserId, blockedUserIds, createMessageParams)

    if (conversation.type === 'u') {
      const missedParticipantIds = await this.conversationService.restorePrivateConversation(conversation, participantIds)
      await this.#restorePrivateConversationNotification(conversation, messageId, missedParticipantIds, deliverMessages)
      participantIds.push(...missedParticipantIds)
    }

    await this.#createMessageNotification(conversation, message, messageId, participantIds, deliverMessages)
    
    await this.conversationService.conversationRepo.updateLastActivity(conversation.params._id, message.params.created_at)

    return { messageId, message: await this.messageMapper(message), deliverMessages }
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

    return { conversation: await this.conversationMapper(conversation), participantIds }
  }

  async #checkBlocked(conversation, currentUserId, participantIds) {
    const stringParticipantIds = participantIds.map(pId => pId.toString())

    const userIdsWhoBlockedCurrentUser = await this.blockListRepo.getBlockingUsers(currentUserId, stringParticipantIds)

    if (conversation.params.type === 'u' && userIdsWhoBlockedCurrentUser.length) {
      throw new Error(ERROR_STATUES.USER_BLOCKED.message, {
        cause: ERROR_STATUES.USER_BLOCKED,
      })
    }

    const isAllBlocked = userIdsWhoBlockedCurrentUser.length === participantIds.length - 1
    if (conversation.params.type === 'g' && isAllBlocked) {
      throw new Error(ERROR_STATUES.USER_BLOCKED_FOR_ALL_PARTICIPANTS.message, {
        cause: ERROR_STATUES.USER_BLOCKED_FOR_ALL_PARTICIPANTS,
      })
    }

    return userIdsWhoBlockedCurrentUser
  }

  async #createMessageNotification(conversation, message, messageId, participantIds, deliverMessages) {
    const user = await this.userService.userRepo.findById(message.params.from)
    const userLogin = user.params.login

    const firstAttachmentUrl = !message.params.attachments?.length
      ? null
      : await this.storageService.getDownloadUrl(
        message.params.attachments[0].file_id
        )

    const pushPayload = Object.assign({
      title:
        conversation.params.type === 'u'
          ? userLogin
          : `${userLogin} | ${conversation.params.name}`,
      body: message.params.body,
      firstAttachmentUrl,
      cid: message.params.cid,
    })

    const createdMessage = { message: message.visibleParams() }
    
    const createChatAlertEventOptions = new CreateChatAlertEventOptions({
      conversationId: conversation.params._id,
      messageId: messageId,
      senderID: message.params.from,
    }, pushPayload)

    deliverMessages.push(new DeliverMessage(participantIds, createdMessage).addPushQueueMessage(createChatAlertEventOptions))
  }

  async #restorePrivateConversationNotification(conversation, messageId, participantIds, deliverMessages) {
    const eventMessage = {
      event: { conversation_created: conversation },
      id: messageId,
    }

    deliverMessages.push(new DeliverMessage(participantIds, eventMessage))
  }
}

export default MessageCreateOperation
