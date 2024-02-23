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
    const currentParticipantIds = await this.findDialogParticipants(conversation.params._id)

    const addParticipantsCount = await this.addParticipants(conversation, addParticipants, currentParticipantIds)

    const {
      newOwnerId,
      removedCount: removeParticipantsCount
    } = await this.removeParticipants(conversation, removeParticipants, currentParticipantIds)

    return { addParticipantsCount, removeParticipantsCount, newOwnerId }
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

    return participantIds.length
  }

  async removeParticipants(conversation, participantIds, currentParticipantIds) {
    if (!currentParticipantIds) {
      currentParticipantIds = await this.findDialogParticipants(conversation.params._id)
    }

    participantIds = participantIds.filter(pId => currentParticipantIds.find(currentPId => currentPId.toString() === pId.toString()))
    await this.conversationParticipantRepo.removeParticipants(conversation.params._id, participantIds)

    let newOwnerId = null
    const isOwnerInRemove = participantIds.find(pId => pId.toString() === conversation.params.owner_id.toString())
    if (isOwnerInRemove) {
      newOwnerId = currentParticipantIds.at(0)
      await this.conversationRepo.update(conversation.params._id, { owner_id: newOwnerId })
    }

    return { removedCount: participantIds.length, newOwnerId }
  }
}

export default ConversationService
