import BaseRepository from '../base.js'

class ConversationParticipantRepository extends BaseRepository {
  async create(createParams) {
    createParams.conversation_id = this.safeWrapOId(createParams.conversation_id)
    createParams.user_id = this.safeWrapOId(createParams.user_id)

    return await super.create(createParams)
  }

  async findDialogParticipants(conversationId) {
    const participants = await this.findAll({ conversation_id: conversationId })

    return participants
  }

  async removeParticipants(conversationId, participantIds) {
    participantIds = participantIds.map(pId => this.safeWrapOId(pId))

    await this.deleteMany({ conversation_id: this.safeWrapOId(conversationId), user_id: { $in: participantIds } })
  }
}

export default ConversationParticipantRepository