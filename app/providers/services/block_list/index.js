class BlockListService {
  constructor(
    blockedUserRepo,
  ) {
    this.blockedUserRepo = blockedUserRepo
  }

  async blockMany(userId, blockUserIds, params) {
    const params = blockUserIds.map(blockedUserId => ({
      enabled: true,

      user_id: userId,
      blocked_user_id: blockedUserId,

      ...params
    }))

    const blockedUsers = await this.blockedUserRepo.createMany(params)

    return blockedUsers
  }

  async unblock(userId, blockedUserIds) {
    await this.blockedUserRepo.deleteBlockedUser(userId, blockedUserIds)
  }

  async enable(userId, isEnabled) {
    await this.blockedUserRepo.enable(userId, isEnabled)
  }

  async list(userId) {
    const blockedUsers = await this.blockedUserRepo.list(userId)

    return blockedUsers
  }

  async listMutualBlockedIds(userId, recipientsIds) {
    const blockedByUser = await this.blockedUserRepo.list(userId, recipientsIds)
    const userInBlock = await this.blockedUserRepo.blockers(userId, recipientsIds)

    const blockedByUserIds = blockedByUser.map(blockUser => blockUser.blocked_user_id)
    const userInBlockIds = userInBlock.map(blockUser => blockUser.user_id)

    const mutualBlocksUserIds = blockedByUserIds.concat(userInBlockIds)

    return Array.from(new Set(mutualBlocksUserIds))
  }

  async deleteAllBlocks(userId) {
    await this.blockedUserRepo.deleteAllBlocks(userId)
  }
}

export default BlockListService
