import { CONSTANTS as MAIN_CONSTANTS } from "../../../../constants/constants.js"

class UserListOperation {
  constructor(sessionService, userService) {
    this.sessionService = sessionService
    this.userService = userService
  }

  async perform(ws, searchParams) {}
}

export default UserListOperation
