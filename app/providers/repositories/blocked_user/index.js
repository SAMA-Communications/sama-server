import BaseRepository from "../base.js"

class BlockedUserRepository extends BaseRepository {
  async prepareParams(params) {
    params.enabled = !!params.enabled

    params.organization_id = this.castOrganizationId(params.organization_id)
    params.user_id = this.castObjectId(params.user_id)
    params.blocked_user_id = this.castObjectId(params.blocked_user_id)

    return await super.prepareParams(params)
  }

  async list(userId, onlyEnabled, recipientsIds) {
    const query = { user_id: this.castObjectId(userId) }

    if (onlyEnabled) {
      const enabledQuery = { enabled: true }

      this.mergeOperators(query, enabledQuery)
    }

    if (recipientsIds) {
      const recipientsFilterQuery = { blocked_user_id: { $in: this.castObjectIds(recipientsIds) } }

      this.mergeOperators(query, recipientsFilterQuery)
    }

    const blockedUsers = await this.findAll(query)

    return blockedUsers
  }

  async blockers(userId, onlyEnabled, recipientsIds) {
    const query = { blocked_user_id: this.castObjectId(userId) }

    if (onlyEnabled) {
      const enabledQuery = { enabled: true }

      this.mergeOperators(query, enabledQuery)
    }

    if (recipientsIds) {
      const recipientsFilterQuery = { user_id: { $in: this.castObjectIds(recipientsIds) } }

      this.mergeOperators(query, recipientsFilterQuery)
    }

    const blockedUsers = await this.findAll(query)

    return blockedUsers
  }

  async enable(userId, enabled) {
    const query = { user_id: this.castObjectId(userId) }
    const update = { enabled: !!enabled }

    await this.updateMany(query, { $set: update })
  }

  async deleteBlockedUser(userId, blockedUserIds) {
    const query = {
      user_id: this.castObjectId(userId),
    }

    if (blockedUserIds) {
      const blockedUsersFilter = { blocked_user_id: { $in: this.castObjectIds(blockedUserIds) } }

      this.mergeOperators(query, blockedUsersFilter)
    }

    await this.deleteMany(query)
  }

  async deleteAllBlocks(userId) {
    const query = {
      $or: [{ user_id: this.castObjectId(userId) }, { blocked_user_id: this.castObjectId(userId) }],
    }

    await this.deleteMany(query)
  }
}

export default BlockedUserRepository
