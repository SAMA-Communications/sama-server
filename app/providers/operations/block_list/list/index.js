class BlockListRetrieveOperation {
  constructor(sessionService, blockListService) {
    this.sessionService = sessionService
    this.blockListService = blockListService
  }

  async perform(ws) {
    const currentUserId = this.sessionService.getSessionUserId(ws)

    const blockedUsers = await this.blockListService.list(currentUserId)

    const userIds = blockedUsers.map((blockedUser) => blockedUser.blocked_user_id)

    return userIds
  }
}

export default BlockListRetrieveOperation
