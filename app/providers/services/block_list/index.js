class BlockListService {
  constructor(
    helpers,
    blockedUserRepo,
  ) {
    this.helpers = helpers
    this.blockedUserRepo = blockedUserRepo
  }

  async blockMany(userId, blockUserIds) {
    const isSelfUserBlocked = blockUserIds.find(blockedUserId => this.helpers.isEqualsNativeIds(userId, blockedUserId))
    if (isSelfUserBlocked) {
      throw new Error(`Can't block self user`)
    }

    const params = blockUserIds.map(blockedUserId => ({
      enabled: true,

      user_id: userId,
      blocked_user_id: blockedUserId
    }))

    const blockedUsers = await this.blockedUserRepo.createMany(params)

    return blockedUsers
  }

  async unblock(userId, blockedUserIds) {
    await this.blockedUserRepo.deleteBlockedUser(userId, blockedUserIds)
  }

  async unblockAll(userId) {
    await this.blockedUserRepo.deleteBlockedUser(userId)
  }

  async enable(userId, isEnabled) {
    await this.blockedUserRepo.enable(userId, isEnabled)
  }

  async list(userId) {
    const blockedUsers = await this.blockedUserRepo.list(userId)

    return blockedUsers
  }

  async listMutualBlockedIds(userId, recipientsIds) {
    const blockedByUser = await this.blockedUserRepo.list(userId, true, recipientsIds)
    const userInBlock = await this.blockedUserRepo.blockers(userId, true, recipientsIds)

    const blockedByUserIds = blockedByUser.map(blockUser => blockUser.blocked_user_id)
    const userInBlockIds = userInBlock.map(blockUser => blockUser.user_id)

    const mutualBlocksUserIds = blockedByUserIds.concat(userInBlockIds)

    return mutualBlocksUserIds
  }

  async deleteAllBlocks(userId) {
    await this.blockedUserRepo.deleteAllBlocks(userId)
  }
}

export default BlockListService
