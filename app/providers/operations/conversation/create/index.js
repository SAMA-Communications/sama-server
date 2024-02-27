import { ERROR_STATUES } from '../../../../constants/errors.js'

class ConversationCreateOperation {
  constructor(
    sessionService,
    userService,
    conversationService,
    conversationMapper
  ) {
    this.sessionService = sessionService
    this.userService = userService
    this.conversationService = conversationService
    this.conversationMapper = conversationMapper
  }

  async perform(ws, conversationParams) {
    const currentUserId = this.sessionService.getSessionUserId(ws)

    const participantIds = await this.userService.userRepo.retrieveExistedIds(conversationParams.participants)
    delete conversationParams.participants
    conversationParams.owner_id = currentUserId

    let conversation = null
    if (conversationParams.type === 'u') {
      conversation = await this.#createPrivateConversation(conversationParams, participantIds)
    } else {
      conversation = await this.#createGroupConversation(conversationParams, participantIds)
    }

    const conversationCreatedMessageNotification = await this.#conversationCreatedNotification()
  
    return { conversation: await this.conversationMapper(conversation), conversationCreatedMessageNotification }
  }

  async #createPrivateConversation(conversationParams, participantIds) {
    conversationParams.opponent_id = await this.#validatePrivateConversationParticipant(
      conversationParams.owner_id,
      conversationParams.opponent_id,
      participantIds
    )

    let existedConversation = await this.conversationService.findExistedPrivateConversation(
      conversationParams.owner_id,
      conversationParams.opponent_id
    )

    if (existedConversation) {
      await this.conversationService.restorePrivateConversation(existedConversation)
    } else {
      existedConversation = await this.#createNewPrivateConversation(conversationParams)
    }

    return existedConversation
  }

  async #validatePrivateConversationParticipant(ownerId, paramsOpponentId, participantIds) {
    if (participantIds.length >= 3) {
      throw new Error(ERROR_STATUES.TOO_MANY_USERS_IN_PRIVATE.message, {
        cause: ERROR_STATUES.TOO_MANY_USERS_IN_PRIVATE,
      })
    }

    const opponentId = paramsOpponentId || participantIds.find(pId => pId.toString() !== ownerId.toString())

    if (opponentId.toString() === ownerId.toString()) {
      throw new Error(ERROR_STATUES.INCORRECT_USER.message, {
        cause: ERROR_STATUES.INCORRECT_USER,
      })
    }

    const opponentUser = await this.userService.userRepo.findById(opponentId)
    if (!opponentUser) {
      new Error(ERROR_STATUES.OPPONENT_NOT_FOUND.message, {
        cause: ERROR_STATUES.OPPONENT_NOT_FOUND,
      })
    }

    return opponentId
  }

  async #createNewPrivateConversation(conversationParams) {
    const participantIds = [conversationParams.owner_id, conversationParams.opponent_id]
    const createdConversation = await this.conversationService.create(conversationParams, participantIds)

    return createdConversation
  }

  async #createGroupConversation(conversationParams, participantIds) {
    const isOwnerInParticipants = participantIds.find(pId => pId.toString() === conversationParams.owner_id.toString())
    if (!isOwnerInParticipants) {
      participantIds.push(conversationParams.owner_id)
    }

    if (participantIds.length === 1) {
      throw new Error(ERROR_STATUES.PARTICIPANTS_NOT_PROVIDED.message, {
        cause: ERROR_STATUES.PARTICIPANTS_NOT_PROVIDED,
      })
    }

    const createdConversation = await this.conversationService.create(conversationParams, participantIds)

    return createdConversation
  }

  async #conversationCreatedNotification() {
    return null
  }
}

export default ConversationCreateOperation
