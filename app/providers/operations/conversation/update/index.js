import { ERROR_STATUES } from '../../../../constants/errors.js'

class ConversationUpdateOperation {
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
    const conversationId = conversationParams.id
    delete conversationParams.id
    
    const currentUserId = this.sessionService.getSessionUserId(ws)
    
    const conversation = await this.#hasAccess(conversationId, currentUserId)

    if (conversationParams.participants) {
      await this.#updateParticipants(conversation, conversationParams.participants)
    }
    delete conversationParams.participants

    const updatedConversation = await this.conversationService.conversationRepo.update(conversationId, conversationParams)

    return await this.conversationMapper(updatedConversation)
  }

  async #hasAccess(conversationId, userId) {
    const { conversation, asOwner } = await this.conversationService.hashAccessToConversation(conversationId, userId)
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

    return conversation
  }

  async #updateParticipants(conversation, updateParticipants) {
    let { add: addUsers, remove: removeUsers } = updateParticipants

    if (addUsers?.length) {
      addUsers = await this.userService.userRepo.retrieveExistedIds(addUsers)
    }

    if (removeUsers?.length) {
      removeUsers = await this.userService.userRepo.retrieveExistedIds(removeUsers)
    }

    addUsers ??= []
    removeUsers ??= []

    await this.conversationService.updateParticipants(conversation, addUsers, removeUsers)
  }
}

export default ConversationUpdateOperation
