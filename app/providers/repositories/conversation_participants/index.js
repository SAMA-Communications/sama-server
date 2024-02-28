import BaseRepository from '../base.js'

class ConversationParticipantRepository extends BaseRepository {
  async prepareParams(params) {
    params.conversation_id = this.safeWrapOId(params.conversation_id)
    params.user_id = this.safeWrapOId(params.user_id)

    return await super.prepareParams(params)
  }

  async findConversationParticipants(conversationId) {
    const participants = await this.findAll({ conversation_id: conversationId })

    return participants
  }

  async findConversationsParticipants(conversationIds, participantId) {
    const availableConversationParticipants = await this.findAll({ conversation_id: { $in: conversationIds }, user_id: participantId })
    const availableConversationIds = availableConversationParticipants.map(participant => participant.params.conversation_id)

    const conversationsParticipants = await this.findAll({ conversation_id: { $in: availableConversationIds }, user_id: { $ne: participantId } })

    return conversationsParticipants
  }

  async findParticipantConversations(userId, limit) {
    const conversationParticipants = await this.findAll({ user_id: userId }, null, limit)

    return conversationParticipants.map(conversationParticipant => conversationParticipant.params.conversation_id)
  }

  async isConversationHasParticipants(conversationId) {
    const participants = await this.findOne({ conversation_id: conversationId })
    
    return !!participants
  }

  async removeParticipants(conversationId, participantIds) {
    participantIds = participantIds.map(pId => this.safeWrapOId(pId))

    await this.deleteMany({ conversation_id: this.safeWrapOId(conversationId), user_id: { $in: participantIds } })
  }
}

export default ConversationParticipantRepository