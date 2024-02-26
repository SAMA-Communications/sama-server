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

    for (const participantId of participantIds) {
      await this.conversationParticipantRepo.create({
        conversation_id: conversation.params._id,
        user_id: participantId,
      })
    }

    return conversation
  }

  async findExistedPrivateDialog(ownerId, participantId) {
    const conversation = await this.conversationRepo.findExistedPrivateDialog(ownerId, participantId)

    return conversation
  }

  async findDialogParticipants(conversationId) {
    const participants = await this.conversationParticipantRepo.findDialogParticipants(conversationId)

    return participants.map(participant => participant.params.user_id)
  }

  async hashAccessToConversation(conversationId, userId) {
    const result = { conversation: null, asParticipant: false, asOwner: false }

    result.conversation = await this.conversationRepo.findById(conversationId)
    
    if (!result.conversation) {
      return result
    }

    const participants = await this.findDialogParticipants(conversationId)
    result.asParticipant = !!participants.find(pId => pId.toString() === userId.toString())
    result.asOwner = result.conversation.params.owner_id.toString() === userId.toString()

    return result
  }

  async updateParticipants(conversation, addParticipants, removeParticipants) {
    let currentParticipantIds = await this.findDialogParticipants(conversation.params._id)

    const addedParticipantIds = await this.addParticipants(conversation, addParticipants, currentParticipantIds)

    currentParticipantIds.concat(addedParticipantIds)

    const removeResult = await this.removeParticipants(conversation, removeParticipants, currentParticipantIds)

    return { addedParticipantIds, ...removeResult }
  }

  async addParticipants(conversation, participantIds, currentParticipantIds) {
    if (!currentParticipantIds) {
      currentParticipantIds = await this.findDialogParticipants(conversation.params._id)
    }

    participantIds = participantIds.filter(pId => currentParticipantIds.find(currentPId => currentPId.toString() === pId.toString()))

    const participantsCount = participantIds.length + currentParticipantIds.length

    if (participantsCount > this.CONVERSATION_MAX_PARTICIPANTS) {
      throw new Error(ERROR_STATUES.PARTICIPANTS_LIMIT.message, {
        cause: ERROR_STATUES.PARTICIPANTS_LIMIT,
      })
    }

    for (const participantId of participantIds) {
      await this.conversationParticipantRepo.create({
        conversation_id: conversation.params._id,
        user_id: participantId,
      })
    }

    return participantIds
  }

  async removeParticipants(conversation, participantIds, currentParticipantIds) {
    const result = { removedIds: null, newOwnerId: null, isEmptyAndDeleted: false }

    if (!currentParticipantIds) {
      currentParticipantIds = await this.findDialogParticipants(conversation.params._id)
    }

    participantIds = participantIds.filter(pId => currentParticipantIds.find(currentPId => currentPId.toString() === pId.toString()))
    await this.conversationParticipantRepo.removeParticipants(conversation.params._id, participantIds)
    result.removedIds = participantIds

    const isConversationHasParticipants = await this.conversationParticipantRepo.isConversationHasParticipants(conversation.params._id)

    if (!isConversationHasParticipants) {
      await this.conversationRepo.deleteById(conversation.params._id)
      result.isEmptyAndDeleted = true
      return result
    }

    const isOwnerInRemove = participantIds.find(pId => pId.toString() === conversation.params.owner_id.toString())
    if (isOwnerInRemove && conversation.params.type !== 'u') {
      const newOwnerId = currentParticipantIds.at(0)
      await this.conversationRepo.update(conversation.params._id, { owner_id: newOwnerId })
      result.newOwnerId = newOwnerId
    }

    return result
  }

  async conversationsList(userId, limit, options) {
    const conversationIds = await this.conversationParticipantRepo.findParticipantConversations(userId, limit)

    const filterOptions = {}
    if (options.updated_at?.gt) {
      filterOptions.updatedAtFrom = new Date(options.updated_at.gt)
    }

    const conversations = await this.conversationRepo.list(conversationIds, limit, filterOptions)

    return conversations
  } 
}

export default ConversationService
