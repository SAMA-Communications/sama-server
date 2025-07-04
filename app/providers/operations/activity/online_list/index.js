class OnlineListOperation {
  constructor(sessionService, userService) {
    this.sessionService = sessionService
    this.userService = userService
  }

  async perform(ws, onlineListParams) {
    const { count: isCountRequest, idsOnly, offset, limit } = onlineListParams

    const { userId: currentUserId, organizationId } = this.sessionService.getSession(ws)

    if (isCountRequest) {
      const count = await this.sessionService.onlineUsersCount(organizationId)

      return count
    }

    const userIds = await this.sessionService.onlineUsersList(organizationId, offset, limit)

    if (idsOnly) {
      return userIds
    }

    const users = await this.userService.userRepo.findAllByIds(userIds)

    return users
  }
}

export default OnlineListOperation
