import { CONSTANTS as MAIN_CONSTANTS } from "../../../../constants/constants.js"
import { slice } from "@sama/utils/req_res_utils.js"

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
      { match: searchParams.login, ignoreIds, timeFromUpdate: searchParams.updated_at?.gt },
      limit
    )

    const usersWithAvatars = await this.userService.addAvatarUrl(users.map((user) => user.visibleParams()))

    return usersWithAvatars
  }
}

export default UserSearchOperation
