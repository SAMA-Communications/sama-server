import BaseRepository from "../base.js"

class ConversationParticipantRepository extends BaseRepository {
  async prepareParams(params) {
    params.conversation_id = this.castObjectId(params.conversation_id)
    params.user_id = this.castUserId(params.user_id)
    params.organization_id = this.castOrganizationId(params.organization_id)

    return await super.prepareParams(params)
  }

  async findConversationParticipants(conversationId, exceptUserIds, lastObjectId, limit) {
    const query = { conversation_id: conversationId }

    if (exceptUserIds?.length) {
      query.user_id = { $nin: this.castObjectIds(exceptUserIds) }
    }

    if (lastObjectId) {
      query._id = { $lt: this.castObjectId(lastObjectId) }
    }

    const participants = await this.findAll(query, null, limit, { _id: -1 })

    return participants
  }

  async countConversationParticipants(conversationId, exceptUserIds) {
    const query = { conversation_id: conversationId }

    if (exceptUserIds?.length) {
      query.user_id = { $nin: this.castObjectIds(exceptUserIds) }
    }

    const count = await this.count(query)

    return count
  }

  async filterAvaibleConversationIds(conversationIds, participantId) {
    const availableConversationParticipants = await this.findAll({
      conversation_id: { $in: conversationIds },
      user_id: participantId,
    })
    const availableConversationIds = availableConversationParticipants.map((participant) => participant.conversation_id)

    return availableConversationIds
  }

  async findConversationsParticipants(conversationIds) {
    const conversationsParticipants = await this.aggregate([
      { $match: { conversation_id: { $in: conversationIds } } },
      { $group: { _id: "$conversation_id", users: { $push: "$user_id" } } },
      {
        $project: {
          _id: 0,
          conversation_id: { $toString: "$_id" },
          users: { $map: { input: "$users", as: "u", in: { $toString: "$$u" } } },
        },
      },
    ])

    const conversationsParticipantsByIds = conversationsParticipants.reduce((arr, { conversation_id, users }) => {
      arr[conversation_id] = users
      return arr
    }, {})

    return conversationsParticipantsByIds
  }

  async findParticipantConversations(userId, options = {}, limit) {
    const query = { user_id: userId }

    if (options.updatedAtFrom || options.updatedAtTo) {
      query.updated_at = this.mergeOperators(query.updated_at, {
        ...(options.updatedAtFrom && { $gt: options.updatedAtFrom }),
        ...(options.updatedAtTo && { $lt: options.updatedAtTo }),
      })
    }

    const conversationParticipants = await this.findAll(query, null, limit)

    return conversationParticipants.map((conversationParticipant) => conversationParticipant.conversation_id)
  }

  async isConversationHasParticipants(conversationId) {
    const participants = await this.findOne({ conversation_id: conversationId })

    return !!participants
  }

  async extractParticipantIdsFromPrivateConversations(conversations) {
    return conversations.reduce((ids, conversation) => {
      ids.add(conversation.owner_id)
      ids.add(conversation.opponent_id)
      return ids
    }, new Set())
  }

  async removeParticipants(conversationId, participantIds) {
    participantIds = this.castUserIds(participantIds)

    await this.deleteMany({ conversation_id: this.castObjectId(conversationId), user_id: { $in: participantIds } })
  }
}

export default ConversationParticipantRepository
