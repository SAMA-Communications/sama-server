import BaseRepository from './base.js'

export default class ConversationParticipantsRepository extends BaseRepository {
  constructor(model) {
    super(model, null);
  }

  async findParticipantsByConversation(cid) {
    const convParticipants = await this.model.findAll(
      {
        conversation_id: cid,
      },
      ['user_id'],
      100
    )

    return convParticipants.map((obj) => obj.user_id)
  }
}
