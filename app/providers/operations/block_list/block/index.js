class BlockListBlockOperation {
  constructor(sessionService, userService, blockListService) {
    this.sessionService = sessionService
    this.userService = userService
    this.blockListService = blockListService
  }

  async perform(ws, blockParams) {
    const { ids: targetUserIds } = blockParams

    const { userId: currentUserId, organizationId } = this.sessionService.getSession(ws)

    const normalizedIds = await this.userService.userRepo.retrieveExistedIds(organizationId, targetUserIds)

    const blockedUsers = await this.blockListService.blockMany(organizationId, currentUserId, normalizedIds)

    return blockedUsers
  }
}

export default BlockListBlockOperation
