class BlockListBlockOperation {
  constructor(sessionService, blockListService) {
    this.sessionService = sessionService
    this.blockListService = blockListService
  }

  async perform(ws, blockParams) {
    const { ids:targetUserIds, system, group } = blockParams

    const currentUserId = this.sessionService.getSessionUserId(ws)

    const optionalBlockParams = { group: !!group, system: !!system }

    const blockedUsers = await this.blockListService.blockMany(currentUserId, targetUserIds, optionalBlockParams)

    return blockedUsers
  }
}

export default BlockListBlockOperation
