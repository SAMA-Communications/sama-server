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
}

export default ConversationParticipantRepository