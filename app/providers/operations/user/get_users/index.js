class UserListOperation {
  constructor(sessionService, userService) {
    this.sessionService = sessionService
    this.userService = userService
  }

  async perform(ws, userListParams) {
    const { ids: userIds } = userListParams

    const users = await this.userService.findByIds(userIds)

    return users
  }
}

export default UserListOperation
