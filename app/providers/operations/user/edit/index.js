import { ERROR_STATUES } from '../../../../constants/errors.js'

class UserEditOperation {
  constructor(sessionService, userService, contactsMatchRepository) {
    this.sessionService = sessionService
    this.userService = userService
    this.contactsMatchRepository = contactsMatchRepository
  }

  async perform (ws, updateUserParams) {
    const userId = this.sessionService.getSessionUserId(ws)
    const currentUser = await this.userService.userRepo.findById(userId)
    if (!currentUser) {
      throw new Error(ERROR_STATUES.USER_LOGIN_OR_PASS.message, {
        cause: ERROR_STATUES.USER_LOGIN_OR_PASS,
      })
    }

    const updatedUser = await this.userService.update(currentUser, updateUserParams)

    await this.contactsMatchRepository.matchUserWithContactOnUpdate(
      updatedUser._id.toString(),

      updatedUser.phone,
      updatedUser.email,

      currentUser.phone,
      currentUser.email
    )

    return updatedUser
  }
}

export default UserEditOperation
