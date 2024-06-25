import { ERROR_STATUES } from "../../../../constants/errors.js"

class UserDeleteOperation {
  constructor(sessionService, userService, activityManagerService, blockListService, contactsMatchRepository) {
    this.sessionService = sessionService
    this.userService = userService
    this.activityManagerService = activityManagerService
    this.blockListService = blockListService
    this.contactsMatchRepository = contactsMatchRepository
  }

  async perform(ws) {
    const userId = this.sessionService.getSessionUserId(ws)
    if (!userId) {
      throw new Error(ERROR_STATUES.FORBIDDEN.message, {
        cause: ERROR_STATUES.FORBIDDEN,
      })
    }

    await this.activityManagerService.unsubscribeObserver(userId)

    await this.sessionService.removeAllUserSessions(ws)

    const user = await this.userService.userRepo.findById(userId)
    if (!user) {
      throw new Error(ERROR_STATUES.FORBIDDEN.message, {
        cause: ERROR_STATUES.FORBIDDEN,
      })
    }

    await this.blockListService.deleteAllBlocks(user.native_id)
    await this.contactsMatchRepository.matchUserWithContactOnDelete(user.native_id, user.phone, user.email)

    await this.userService.userRepo.deleteById(user.native_id)

    return userId
  }
}

export default UserDeleteOperation
