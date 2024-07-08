class BlockListUnblockOperation {
  constructor(sessionService, blockListService) {
    this.sessionService = sessionService
    this.blockListService = blockListService
  }

  async perform(ws, targetUserIds) {
    const currentUserId = this.sessionService.getSessionUserId(ws)

    targetUserIds = Array.isArray(targetUserIds) ? targetUserIds : [targetUserIds]

    await this.blockListService.unblock(currentUserId, targetUserIds)

    return targetUserIds
  }
}

export default BlockListUnblockOperation
