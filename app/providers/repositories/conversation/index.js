import BaseRepository from '../base.js'

class ConversationRepository extends BaseRepository {
  async create(createParams) {
    createParams.owner_id = this.safeWrapOId(createParams.owner_id)
    if (createParams.opponent_id) {
      createParams.opponent_id = this.safeWrapOId(createParams.opponent_id)
    }

    return await super.create(createParams)
  }

  async findExistedPrivateDialog(ownerId, opponentId) {
    ownerId = this.safeWrapOId(ownerId)
    opponentId = this.safeWrapOId(opponentId)    

    const conversation = await this.findOne({
      $or: [
        {
          type: 'u',
          owner_id: ownerId,
          opponent_id: opponentId,
        },
        {
          type: 'u',
          owner_id: opponentId,
          opponent_id: ownerId,
        },
      ],
    })

    return conversation
  }
}

export default ConversationRepository