import { CONSTANTS as MAIN_CONSTANTS } from "../../../../constants/constants.js"

class UserSearchOperation {
  constructor(sessionService, userService) {
    this.sessionService = sessionService
    this.userService = userService
  }

  async perform(ws, searchParams) {
    const { userId: currentUserId, organizationId } = this.sessionService.getSession(ws)
    const ignoreIds = [currentUserId, ...searchParams.ignore_ids]

    const limit =
      searchParams.limit > MAIN_CONSTANTS.SEARCH_LIMIT_MAX
        ? MAIN_CONSTANTS.SEARCH_LIMIT_MAX
        : searchParams.limit || MAIN_CONSTANTS.SEARCH_LIMIT_MAX

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
