class UserListOperation {
  constructor(userService) {
    this.userService = userService
  }

  async perform(ws, userListParams) {
    const { ids: userIds } = userListParams

    const users = await this.userService.userRepo.findAllByIds(userIds)

    const usersWithAvatars = await this.userService.addAvatarUrl(users)

    const userFields = usersWithAvatars.map((user) => user.visibleParams())

    return userFields
  }
}

export default UserListOperation
