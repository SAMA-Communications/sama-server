import { ERROR_STATUES } from '../../../constants/errors.js'

class ConversationService {
  constructor(
    conversationRepo,
    conversationParticipantRepo
  ) {
    this.CONVERSATION_MAX_PARTICIPANTS = process.env.CONVERSATION_MAX_PARTICIPANTS

    this.conversationRepo = conversationRepo
    this.conversationParticipantRepo = conversationParticipantRepo
  }

  async create(conversationParams, participantIds) {
    const conversation = await this.conversationRepo.create(conversationParams)

    await this.addParticipants(conversation, participantIds, [])

    return conversation
  }

  async conversationsList(userId, options, limit) {
    const conversationIds = await this.conversationParticipantRepo.findParticipantConversations(userId, limit)

    const filterOptions = {}
    if (options.updatedAt?.gt) {
      filterOptions.updatedAtFrom = new Date(options.updatedAt.gt)
    }

    const conversations = await this.conversationRepo.list(conversationIds, filterOptions, limit)

    return conversations
  }

  async restorePrivateConversation(conversation, currentParticipantIds) {
    const requiredParticipantIds = [conversation.owner_id, conversation.opponent_id].map(pId => pId.toString())

    const missedParticipantIds = await this.addParticipants(conversation, requiredParticipantIds, currentParticipantIds)

    return missedParticipantIds
  }

  async findExistedPrivateConversation(ownerId, participantId) {
    const conversation = await this.conversationRepo.findExistedPrivateConversation(ownerId, participantId)

    return conversation
  }

  async findConversationParticipants(conversationId) {
    const participants = await this.conversationParticipantRepo.findConversationParticipants(conversationId)

    return participants.map(participant => participant.user_id)
  }

  async findConversationsParticipantIds(conversationIds, participantId) {
    const conversationsParticipants = await this.conversationParticipantRepo.findConversationsParticipants(conversationIds, participantId)

    return conversationsParticipants.map(participant => participant.user_id)
  }

  async hashAccessToConversation(conversationId, userId) {
    const result = { conversation: null, asParticipant: false, asOwner: false, participantIds: null }

    result.conversation = await this.conversationRepo.findById(conversationId)
    
    if (!result.conversation) {
      return result
    }

    const participantIds = await this.findConversationParticipants(conversationId)
    result.asParticipant = !!participantIds.find(pId => pId.toString() === userId.toString())
    result.asOwner = result.conversation.owner_id.toString() === userId.toString()
    result.participantIds = participantIds

    return result
  }

  async updateParticipants(conversation, addParticipants, removeParticipants, currentParticipantIds) {
    if (!currentParticipantIds) {
      currentParticipantIds = await this.findConversationParticipants(conversation._id)
    }

    const addedIds = await this.addParticipants(conversation, addParticipants, currentParticipantIds)

    currentParticipantIds.concat(addedIds)

    const removeResult = await this.removeParticipants(conversation, removeParticipants, currentParticipantIds)

    if (!removeResult.isEmptyAndDeleted && removeResult.removedIds?.length) {
      currentParticipantIds = currentParticipantIds.filter(currentPId => !removeResult.removedIds.find(removedId => removedId.toString() === currentPId.toString()))
    }

    return { addedIds, ...removeResult, currentIds: currentParticipantIds }
  }

  async addParticipants(conversation, participantIds, currentParticipantIds) {
    if (!currentParticipantIds) {
      currentParticipantIds = await this.findConversationParticipants(conversation._id)
    }

    participantIds = participantIds.filter(pId => !currentParticipantIds.find(currentPId => currentPId.toString() === pId.toString()))

    const participantsCount = participantIds.length + currentParticipantIds.length

    if (participantsCount > this.CONVERSATION_MAX_PARTICIPANTS) {
      throw new Error(ERROR_STATUES.PARTICIPANTS_LIMIT.message, {
        cause: ERROR_STATUES.PARTICIPANTS_LIMIT,
      })
    }

    if (participantIds.length) {
      const createParticipantsParams = participantIds.map(participantId => ({
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

    participantIds = participantIds.filter(pId => currentParticipantIds.find(currentPId => currentPId.toString() === pId.toString()))
    await this.conversationParticipantRepo.removeParticipants(conversation._id, participantIds)
    result.removedIds = participantIds

    const isConversationHasParticipants = await this.conversationParticipantRepo.isConversationHasParticipants(conversation._id)

    if (!isConversationHasParticipants) {
      await this.conversationRepo.deleteById(conversation._id)
      result.isEmptyAndDeleted = true
      return result
    }

    const isOwnerInRemove = participantIds.find(pId => pId.toString() === conversation.owner_id.toString())
    if (isOwnerInRemove && conversation.type !== 'u') {
      const newOwnerId = currentParticipantIds.at(0)
      await this.conversationRepo.updateOwner(conversation._id, newOwnerId)
      result.newOwnerId = newOwnerId
    }

    return result
  }
}

export default ConversationService
