class ConversationService {
  constructor(
    conversationRepo,
    conversationParticipantRepo
  ) {
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
}

export default ConversationService
