class UserListOperation {
  constructor(sessionService, userService) {
    this.sessionService = sessionService
    this.userService = userService
  }

  async perform(ws, userListParams) {
    const { ids: userIds } = userListParams

    const users = await this.userService.findByIds(userIds)
    const usersWithAvatars = await this.userService.addAvatarUrl(users.map((user) => user.visibleParams()))

    return usersWithAvatars
  }
}

export default UserListOperation