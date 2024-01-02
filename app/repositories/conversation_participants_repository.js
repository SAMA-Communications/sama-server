import BaseRepository from './base.js'

import ConversationParticipant from '../models/conversation_participant.js'

class ConversationParticipantsRepository extends BaseRepository {
  async findParticipantsByConversation(cid) {
    const convParticipants = await this.Model.findAll(
      {
        conversation_id: cid,
      },
      ['user_id'],
      100
    )

    return convParticipants.map((obj) => obj.user_id)
  }
}

export default new ConversationParticipantsRepository(ConversationParticipant)
