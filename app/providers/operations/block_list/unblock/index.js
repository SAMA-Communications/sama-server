class BlockListUnblockOperation {
  constructor(sessionService, blockListService) {
    this.sessionService = sessionService
    this.blockListService = blockListService
  }

  async perform(ws, targetUserIds) {
    const { userId: currentUserId, organizationId } = this.sessionService.getSession(ws)

    targetUserIds = Array.isArray(targetUserIds) ? targetUserIds : [targetUserIds]

    await this.blockListService.unblock(currentUserId, targetUserIds)

    return targetUserIds
  }
}

export default BlockListUnblockOperation
