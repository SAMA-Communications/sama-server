class UserListOperation {
  constructor(userService) {
    this.userService = userService
  }

  async perform(ws, userListParams) {
    const { ids: userIds } = userListParams

    const users = await this.userService.findByIds(userIds)

    return users.map((user) => user.visibleParams())
  }
}

export default UserListOperation
