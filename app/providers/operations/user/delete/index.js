import { ERROR_STATUES } from '../../../../constants/errors.js'
import { ACTIVE } from '../../../../store/session.js'

class UserDeleteOperation {
  constructor(
    sessionService,
    userService,
    activityManagerService,
    blockListRepository,
    contactsMatchRepository,
  ) {
    this.sessionService = sessionService
    this.userService = userService
    this.activityManagerService = activityManagerService
    this.blockListRepository = blockListRepository
    this.contactsMatchRepository = contactsMatchRepository
  }

  async perform (ws) {
    const userId = this.sessionService.getSessionUserId(ws)
    if (!userId) {
      throw new Error(ERROR_STATUES.FORBIDDEN.message, {
        cause: ERROR_STATUES.FORBIDDEN,
      })
    }

    await this.activityManagerService.unsubscribeObserver(userId)

    if (ACTIVE.SESSIONS.get(ws)) {
      delete ACTIVE.DEVICES[userId]
      await this.sessionService.clearUserNodeData(userId)
      ACTIVE.SESSIONS.delete(ws)
    }

    const user = await this.userService.userRepo.findById(userId)
    if (!user) {
      throw new Error(ERROR_STATUES.FORBIDDEN.message, {
        cause: ERROR_STATUES.FORBIDDEN,
      })
    }

    await this.blockListRepository.delete(user.params._id)
    await this.contactsMatchRepository.matchUserWithContactOnDelete(
      user.params._id.toString(),
      user.params.phone,
      user.params.email
    )

    await this.userService.userRepo.deleteById(userId)

    return userId
  }
}

export default UserDeleteOperation
