import { CONSTANTS as MAIN_CONSTANTS } from "../../../../constants/constants.js"

class UserSearchOperation {
  constructor(sessionService, userService) {
    this.sessionService = sessionService
    this.userService = userService
  }

  async perform(ws, searchParams) {
    const currentUserId = this.sessionService.getSessionUserId(ws)
    const ignoreIds = [currentUserId, ...searchParams.ignore_ids]

    const limit =
      searchParams.limit > MAIN_CONSTANTS.LIMIT_MAX
        ? MAIN_CONSTANTS.LIMIT_MAX
        : searchParams.limit || MAIN_CONSTANTS.LIMIT_MAX

    const users = await this.userService.userRepo.search(
      { loginMatch: searchParams.login, ignoreIds, timeFromUpdate: searchParams.updated_at?.gt },
      limit
    )

    const usersSearchResult = users.map((user) => ({ _id: user._id, native_id: user.native_id, login: user.login }))

    return usersSearchResult
  }
}

export default UserSearchOperation
