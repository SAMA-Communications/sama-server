import BaseRepository from '../base.js'

class ConversationRepository extends BaseRepository {
  async create(createParams) {
    createParams.owner_id = this.safeWrapOId(createParams.owner_id)
    if (createParams.opponent_id) {
      createParams.opponent_id = this.safeWrapOId(createParams.opponent_id)
    }

    return await super.create(createParams)
  }

  async findById(conversationId) {
    const conversation = await this.findOne({ _id: conversationId })

    return conversation
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

  async list(conversationIds, limit, options) {
    const query = {
      _id: { $in: conversationIds }
    }

    if (options.updatedAtFrom) {
      query.updated_at = { $gt: options.updatedAtFrom }
    }

    const conversations = await this.findAll(query, null, limit)

    return conversations
  }

  async update(conversationId, updateParams) {
    if (updateParams.owner_id) {
      updateParams.owner_id = this.safeWrapOId(updateParams.owner_id)
    }
    if (updateParams.opponent_id) {
      updateParams.opponent_id = this.safeWrapOId(updateParams.opponent_id)
    }

    const conversation = await this.findOneAndUpdate({ _id: conversationId }, { $set: updateParams })

    return conversation
  }
}

export default ConversationRepository