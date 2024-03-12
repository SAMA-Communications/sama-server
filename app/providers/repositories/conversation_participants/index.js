import BaseRepository from '../base.js'

class ConversationParticipantRepository extends BaseRepository {
  async prepareParams(params) {
    params.conversation_id = this.castObjectId(params.conversation_id)
    params.user_id = this.castObjectId(params.user_id)

    return await super.prepareParams(params)
  }

  async findConversationParticipants(conversationId) {
    const participants = await this.findAll({ conversation_id: conversationId })

    return participants
  }

  async findConversationsParticipants(conversationIds, participantId) {
    const availableConversationParticipants = await this.findAll({ conversation_id: { $in: conversationIds }, user_id: participantId })
    const availableConversationIds = availableConversationParticipants.map(participant => participant.conversation_id)

    const conversationsParticipants = await this.findAll({ conversation_id: { $in: availableConversationIds } })

    return conversationsParticipants
  }

  async findParticipantConversations(userId, limit) {
    const conversationParticipants = await this.findAll({ user_id: userId }, null, limit)

    return conversationParticipants.map(conversationParticipant => conversationParticipant.conversation_id)
  }

  async isConversationHasParticipants(conversationId) {
    const participants = await this.findOne({ conversation_id: conversationId })
    
    return !!participants
  }

  async removeParticipants(conversationId, participantIds) {
    participantIds = this.castObjectIds(participantIds)

    await this.deleteMany({ conversation_id: this.castObjectId(conversationId), user_id: { $in: participantIds } })
  }
}

export default ConversationParticipantRepository