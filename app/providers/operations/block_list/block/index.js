class BlockListBlockOperation {
  constructor(sessionService, blockListService) {
    this.sessionService = sessionService
    this.blockListService = blockListService
  }

  async perform(ws, blockParams) {
    const { ids: targetUserIds } = blockParams

    const currentUserId = this.sessionService.getSessionUserId(ws)

    const blockedUsers = await this.blockListService.blockMany(currentUserId, targetUserIds)

    return blockedUsers
  }
}

export default BlockListBlockOperation
