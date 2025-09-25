import { ERROR_STATUES } from "../../../../constants/errors.js"
import { CONVERSATION_EVENTS } from "../../../../constants/conversation.js"

class ConversationCreateOperation {
  constructor(helpers, sessionService, userService, conversationService, conversationNotificationService) {
    this.helpers = helpers
    this.sessionService = sessionService
    this.userService = userService
    this.conversationService = conversationService
    this.conversationNotificationService = conversationNotificationService
  }

  async perform(ws, conversationParams) {
    const { userId: currentUserId, organizationId } = this.sessionService.getSession(ws)
    const currentUser = await this.userService.userRepo.findById(currentUserId)

    const paramsParticipantIds = conversationParams.participants?.length
      ? await this.userService.userRepo.retrieveExistedIds(organizationId, conversationParams.participants)
      : []
    delete conversationParams.participants
    conversationParams.owner_id = currentUserId

    let conversation = null
    let normalizedParticipants = null

    if (conversationParams.type === "u") {
      const { conversation: createdConversation, participantIds } = await this.#createPrivateConversation(
        currentUser,
        conversationParams,
        paramsParticipantIds
      )
      conversation = createdConversation
      normalizedParticipants = participantIds
    } else if (conversationParams.type === "g") {
      const { conversation: createdConversation, participantIds } = await this.#createGroupConversation(
        currentUser,
        conversationParams,
        paramsParticipantIds
      )

      const updatedConversationWithImageUrl = await this.conversationService.addImageUrl([createdConversation])
      conversation = updatedConversationWithImageUrl.at(0)
      normalizedParticipants = participantIds
    } else {
      const { conversation: createdConversation, participantIds } = await this.#createChannelConversation(
        currentUser,
        conversationParams,
        paramsParticipantIds
      )

      const updatedConversationWithImageUrl = await this.conversationService.addImageUrl([createdConversation])
      conversation = updatedConversationWithImageUrl.at(0)
      normalizedParticipants = participantIds
    }

    const result = { organizationId, conversation }

    if (this.conversationNotificationService.isEnabled()) {
      const conversationEvent = await this.#createActionEvent(conversation, currentUserId)
      conversationEvent.participantIds = normalizedParticipants
      result.event = conversationEvent
    }

    return result
  }

  async #createPrivateConversation(user, conversationParams, participantIds) {
    conversationParams.opponent_id = await this.#validatePrivateConversationParticipant(
      conversationParams.owner_id,
      conversationParams.opponent_id,
      participantIds
    )

    let normalizedParticipants = participantIds
    let existedConversation = await this.conversationService.findExistedPrivateConversation(user, conversationParams.opponent_id)

    if (existedConversation) {
      normalizedParticipants = await this.conversationService.restorePrivateConversation(existedConversation)
    } else {
      existedConversation = await this.#createNewPrivateConversation(user, conversationParams)
      normalizedParticipants = [conversationParams.owner_id, conversationParams.opponent_id]
    }

    return { conversation: existedConversation, participantIds }
  }

  async #validatePrivateConversationParticipant(ownerId, paramsOpponentId, participantIds) {
    if (participantIds.length >= 3) {
      throw new Error(ERROR_STATUES.TOO_MANY_USERS_IN_PRIVATE.message, {
        cause: ERROR_STATUES.TOO_MANY_USERS_IN_PRIVATE,
      })
    }

    const opponentId = paramsOpponentId || participantIds.find((pId) => !this.helpers.isEqualsNativeIds(pId, ownerId))

    if (this.helpers.isEqualsNativeIds(opponentId, ownerId)) {
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

  async #createNewPrivateConversation(user, conversationParams) {
    const participantIds = [conversationParams.owner_id, conversationParams.opponent_id]
    const createdConversation = await this.conversationService.create(user, conversationParams, participantIds)

    return createdConversation
  }

  async #createGroupConversation(user, conversationParams, participantIds) {
    const isOwnerInParticipants = participantIds.find((pId) => this.helpers.isEqualsNativeIds(pId, conversationParams.owner_id))
    if (!isOwnerInParticipants) {
      participantIds.push(conversationParams.owner_id)
    }

    if (participantIds.length === 1) {
      throw new Error(ERROR_STATUES.PARTICIPANTS_NOT_PROVIDED.message, {
        cause: ERROR_STATUES.PARTICIPANTS_NOT_PROVIDED,
      })
    }

    const createdConversation = await this.conversationService.create(user, conversationParams, participantIds)

    return { conversation: createdConversation, participantIds }
  }

  async #createChannelConversation(user, conversationParams, participantIds) {
    const isOwnerInParticipants = participantIds.find((pId) => this.helpers.isEqualsNativeIds(pId, conversationParams.owner_id))
    if (!isOwnerInParticipants) {
      participantIds.push(conversationParams.owner_id)
    }

    const createdConversation = await this.conversationService.create(user, conversationParams, participantIds)

    return { conversation: createdConversation, participantIds }
  }

  async #createActionEvent(conversation, currentUserId) {
    const user = await this.userService.userRepo.findById(currentUserId)

    const actionMessageNotification = await this.conversationNotificationService.actionEvent(
      CONVERSATION_EVENTS.CONVERSATION_EVENT.CREATE,
      conversation,
      user
    )

    return actionMessageNotification
  }
}

export default ConversationCreateOperation
