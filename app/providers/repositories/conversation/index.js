import BaseRepository from "../base.js"

class ConversationRepository extends BaseRepository {
  async prepareParams(params) {
    params.owner_id = this.castObjectId(params.owner_id)
    if (params.opponent_id) {
      params.opponent_id = this.castObjectId(params.opponent_id)
    }

    return await super.prepareParams(params)
  }

  async findExistedPrivateConversationByCid(cid) {
    return this.findOne({ _id: cid })
  }

  async findExistedPrivateConversation(ownerId, opponentId, isEncrypted) {
    ownerId = this.castObjectId(ownerId)
    opponentId = this.castObjectId(opponentId)

    const query = { type: "u" }
    query["is_encrypted"] = isEncrypted || { $ne: true }

    const conversation = await this.findOne({
      $or: [
        {
          owner_id: ownerId,
          opponent_id: opponentId,
          ...query,
        },
        {
          owner_id: opponentId,
          opponent_id: ownerId,
          ...query,
        },
      ],
    })

    return conversation
  }

  async search({ chatNameMatch, ignoreIds, timeFromUpdate }, limit) {
    const query = {
      _id: { $nin: ignoreIds },
      name: { $regex: new RegExp(`${chatNameMatch}.*`, "i") },
    }

    if (timeFromUpdate) {
      query.updated_at = { $gt: new Date(timeFromUpdate) }
    }

    const conversations = await this.findAll(query, ["_id"], limit, { updated_at: -1 })

    return conversations
  }

  async list(conversationIds, options, limit) {
    const query = {
      _id: { $in: conversationIds },
    }

    if (options.updatedAtFrom) {
      query.updated_at = this.mergeOperators(query.updated_at, { $gt: options.updatedAtFrom })
    }

    const conversations = await this.findAll(query, null, limit)

    return conversations
  }

  async updateOwner(conversationId, newOwnerId) {
    await this.updateOne({ _id: conversationId }, { $set: { owner_id: this.castObjectId(newOwnerId) } })
  }

  async updateLastActivity(conversationId, updatedAt) {
    await this.updateOne({ _id: conversationId }, { $set: { updated_at: updatedAt } })
  }

  async update(conversationId, updateParams) {
    if (updateParams.owner_id) {
      updateParams.owner_id = this.castObjectId(updateParams.owner_id)
    }
    if (updateParams.opponent_id) {
      updateParams.opponent_id = this.castObjectId(updateParams.opponent_id)
    }

    const conversation = await this.findOneAndUpdate({ _id: conversationId }, { $set: updateParams })

    return conversation
  }
}

export default ConversationRepository
