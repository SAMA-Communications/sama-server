class BlockListEnableOperation {
  constructor(sessionService, blockListService) {
    this.sessionService = sessionService
    this.blockListService = blockListService
  }

  async perform(ws, isEnabled) {
    const currentUserId = this.sessionService.getSessionUserId(ws)

    await this.blockListService.enable(currentUserId, isEnabled)

    return true
  }
}

export default BlockListEnableOperation
