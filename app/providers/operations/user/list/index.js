class UserListOperation {
  constructor(sessionService, userService) {
    this.sessionService = sessionService
    this.userService = userService
  }

  async perform(ws, userListParams) {
    const { userId: currentUserId, organizationId } = this.sessionService.getSession(ws)

    const { ids: userIds } = userListParams

    const users = await this.userService.userRepo.findWithOrScopeByIds(organizationId, userIds)

    const usersWithAvatars = await this.userService.addAvatarUrl(users)

    const userFields = usersWithAvatars.map((user) => user.visibleParams())

    return userFields
  }
}

export default UserListOperation
