import { ERROR_STATUES } from "../../../constants/errors.js"

class ConversationService {
  constructor(
    CONVERSATION_MAX_PARTICIPANTS,

    helpers,
    storageService,
    conversationRepo,
    conversationParticipantRepo
  ) {
    this.CONVERSATION_MAX_PARTICIPANTS = CONVERSATION_MAX_PARTICIPANTS

    this.helpers = helpers
    this.storageService = storageService
    this.conversationRepo = conversationRepo
    this.conversationParticipantRepo = conversationParticipantRepo
  }

  async create(user, conversationParams, participantIds) {
    conversationParams.owner_id = user.native_id
    const conversation = await this.conversationRepo.create(conversationParams)

    await this.addParticipants(conversation, participantIds, [])

    return conversation
  }

  async addImageUrl(conversations) {
    const imageUrlPromises = conversations.map(async (conv) => {
      if (conv.image_object) {
        ;(conv.params ? conv.params : conv)["image_url"] = await this.storageService.getFileDownloadUrl(
          conv._id,
          conv.image_object.file_id
        )
      }
      return conv
    })

    return await Promise.all(imageUrlPromises)
  }

  async conversationsList(user, options, limit) {
    const conversationIds = await this.conversationParticipantRepo.findParticipantConversations(user.native_id, limit)

    const filterOptions = {}
    if (options.updatedAt?.gt) {
      filterOptions.updatedAtFrom = new Date(options.updatedAt.gt)
    }

    const conversations = await this.conversationRepo.list(conversationIds, filterOptions, limit)

    return conversations
  }

  async restorePrivateConversation(conversation, currentParticipantIds) {
    const requiredParticipantIds = [conversation.owner_id, conversation.opponent_id]

    const missedParticipantIds = await this.addParticipants(conversation, requiredParticipantIds, currentParticipantIds)

    return missedParticipantIds
  }

  async findExistedPrivateConversation(userOwner, participantId, isEncrypted) {
    const conversation = await this.conversationRepo.findExistedPrivateConversation(
      userOwner.native_id,
      participantId,
      isEncrypted
    )

    return conversation
  }

  async findConversationParticipants(conversationId) {
    const participants = await this.conversationParticipantRepo.findConversationParticipants(conversationId)

    return participants.map((participant) => participant.user_id)
  }

  async findConversationsParticipantIds(conversationIds, user) {
    const conversationsParticipants = await this.conversationParticipantRepo.findConversationsParticipants(
      conversationIds,
      user.native_id
    )

    return conversationsParticipants.map((participant) => participant.user_id)
  }

  async hasAccessToConversation(conversationId, userId) {
    const result = { conversation: null, asParticipant: false, asOwner: false, participantIds: null }

    result.conversation = await this.conversationRepo.findById(conversationId)

    if (!result.conversation) {
      return result
    }

    const participantIds = await this.findConversationParticipants(conversationId)
    result.asParticipant = !!participantIds.find((pId) => this.helpers.isEqualsNativeIds(pId, userId))
    result.asOwner = this.helpers.isEqualsNativeIds(result.conversation.owner_id, userId)
    result.participantIds = participantIds

    return result
  }

  async updateParticipants(conversation, addParticipants, removeParticipants, currentParticipantIds) {
    if (!currentParticipantIds) {
      currentParticipantIds = await this.findConversationParticipants(conversation._id)
    }

    const addedIds = await this.addParticipants(conversation, addParticipants, currentParticipantIds)

    currentParticipantIds = currentParticipantIds.concat(addedIds)

    const removeResult = await this.removeParticipants(conversation, removeParticipants, currentParticipantIds)

    if (!removeResult.isEmptyAndDeleted && removeResult.removedIds?.length) {
      currentParticipantIds = currentParticipantIds.filter(
        (currentPId) =>
          !removeResult.removedIds.find((removedId) => this.helpers.isEqualsNativeIds(removedId, currentPId))
      )
    }

    return { addedIds, ...removeResult, currentIds: currentParticipantIds }
  }

  async addParticipants(conversation, participantIds, currentParticipantIds) {
    if (!currentParticipantIds) {
      currentParticipantIds = await this.findConversationParticipants(conversation._id)
    }

    participantIds = participantIds.filter(
      (pId) => !currentParticipantIds.find((currentPId) => this.helpers.isEqualsNativeIds(currentPId, pId))
    )

    const participantsCount = participantIds.length + currentParticipantIds.length

    if (participantsCount > this.CONVERSATION_MAX_PARTICIPANTS) {
      throw new Error(ERROR_STATUES.PARTICIPANTS_LIMIT.message, {
        cause: ERROR_STATUES.PARTICIPANTS_LIMIT,
      })
    }

    if (participantIds.length) {
      const createParticipantsParams = participantIds.map((participantId) => ({
        conversation_id: conversation._id,
        user_id: participantId,
      }))

      await this.conversationParticipantRepo.createMany(createParticipantsParams)
    }

    return participantIds
  }

  async removeParticipants(conversation, participantIds, currentParticipantIds) {
    const result = { removedIds: null, newOwnerId: null, isEmptyAndDeleted: false }

    if (!currentParticipantIds) {
      currentParticipantIds = await this.findConversationParticipants(conversation._id)
    }

    participantIds = participantIds.filter((pId) =>
      currentParticipantIds.find((currentPId) => this.helpers.isEqualsNativeIds(currentPId, pId))
    )
    await this.conversationParticipantRepo.removeParticipants(conversation._id, participantIds)
    result.removedIds = participantIds
    currentParticipantIds = currentParticipantIds.filter(
      (currentPId) => !participantIds.find((removedId) => this.helpers.isEqualsNativeIds(removedId, currentPId))
    )

    const isConversationHasParticipants = await this.conversationParticipantRepo.isConversationHasParticipants(
      conversation._id
    )

    if (!isConversationHasParticipants) {
      await this.conversationRepo.deleteById(conversation._id)
      result.isEmptyAndDeleted = true
      return result
    }

    const isOwnerInRemove = participantIds.find((pId) => this.helpers.isEqualsNativeIds(pId, conversation.owner_id))
    if (isOwnerInRemove && conversation.type !== "u") {
      const newOwnerId = currentParticipantIds.at(0)
      await this.conversationRepo.updateOwner(conversation._id, newOwnerId)
      result.newOwnerId = newOwnerId
    }

    return result
  }
}

export default ConversationService
