class OnlineListOperation {
  constructor(sessionService, userService) {
    this.sessionService = sessionService
    this.userService = userService
  }

  async perform(ws, onlineListParams) {
    const { count: isCountRequest, idsOnly, offset, limit } = onlineListParams

    if (isCountRequest) {
      const count = await this.sessionService.onlineUsersCount()

      return count
    }

    const userIds = await this.sessionService.onlineUsersList(offset, limit)

    if (idsOnly) {
      return userIds
    }

    const users = await this.userService.userRepo.findAllByIds(userIds)

    return users
  }
}

export default OnlineListOperation
