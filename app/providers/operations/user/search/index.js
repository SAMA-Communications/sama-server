class UserSearchOperation {
  constructor(config, sessionService, userService) {
    this.config = config
    this.sessionService = sessionService
    this.userService = userService
  }

  async perform(ws, searchParams) {
    const { userId: currentUserId, organizationId } = this.sessionService.getSession(ws)
    const ignoreIds = [currentUserId, ...searchParams.ignore_ids]

    const maxSearchLimit = this.config.get("conversation.searchLimit")
    const limit = searchParams.limit > maxSearchLimit ? maxSearchLimit : searchParams.limit || maxSearchLimit

    const users = await this.userService.userRepo.search(
      organizationId,
      {
        match: searchParams.keyword,
        ignoreIds,
        timeFromUpdate: searchParams.updated_at?.gt,
      },
      limit
    )

    const usersWithAvatars = await this.userService.addAvatarUrl(users)

    const userFields = usersWithAvatars.map((user) => user.visibleParams())

    return userFields
  }
}

export default UserSearchOperation
