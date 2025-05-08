import BaseRepository from "../base.js"

class MessageReactionRepository extends BaseRepository {
  async prepareParams(params) {
    params.mid = this.castObjectId(params.mid)
    params.user_id = this.castObjectId(params.user_id)

    return await super.prepareParams(params)
  }

  async add(params) {
    return await this.create(params)
  }

  async remove(mid, userId, reaction) {
    const query = {
      mid: this.castObjectId(mid),
      user_id: this.castObjectId(userId),
      reaction: reaction,
    }

    await this.deleteMany(query)
  }

  async aggregateForUserMessages(mIds, userId) {
    if (userId) {
      userId = this.castObjectId(userId)
    }

    const $match = {
      mid: { $in: this.castObjectIds(mIds) },
    }

    const $group_count_reactions = {
      _id: { mid: "$mid", reaction: "$reaction" },
      count: { $sum: 1 },
    }

    if (userId) {
      $group_count_reactions.own = { $addToSet: { $cond: [{ $eq: ["$user_id", userId] }, "$reaction", []] } }
    }

    const $group_accumulate = {
      _id: "$_id.mid",
      total: { $addToSet: { count: "$count", reaction: "$_id.reaction" } },
    }

    if (userId) {
      $group_accumulate.own = { $addToSet: "$own" }
    }

    let result = await this.aggregate([{ $match }, { $group: $group_count_reactions }, { $group: $group_accumulate }])

    const mappedResult = result.reduce((acc, obj) => {
      const own = obj.own?.flat()?.flat() || []

      const total =
        obj.total?.reduce((acc, reactionCountData) => {
          acc[reactionCountData.reaction] = reactionCountData.count
          return acc
        }, {}) || {}

      acc[obj["_id"]] = { own: own.sort(), total }

      return acc
    }, {})

    return mappedResult
  }

  async aggregateMessageReactions(mid) {
    const $match = {
      mid: this.castObjectId(mid),
    }

    const $group_reactions = {
      _id: "$reaction",
      user_ids: { $addToSet: "$user_id" },
    }

    const aggregationResult = await this.aggregate([{ $match }, { $group: $group_reactions }])

    const mappedResult = aggregationResult.reduce((acc, resultItem) => {
      const { _id, user_ids } = resultItem
      acc[_id] = user_ids.sort()
      return acc
    }, {})

    return mappedResult
  }
}

export default MessageReactionRepository
