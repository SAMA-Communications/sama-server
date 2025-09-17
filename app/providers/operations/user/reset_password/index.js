import { ERROR_STATUES } from "../../../../constants/errors.js"

class UserResetPasswordOperation {
  constructor(userService, userTokenRepo) {
    this.userService = userService
    this.userTokenRepo = userTokenRepo
  }

  async perform(ws, data) {
    const { organization_id, email, device_id, token, new_password } = data
    const user = await this.userService.findByEmail(organization_id, email)
    const userId = user.native_id

    if (!user) {
      throw new Error(ERROR_STATUES.USER_NOT_FOUND.message, {
        cause: ERROR_STATUES.USER_NOT_FOUND,
      })
    }
    const otpToken = await this.userTokenRepo.findTokenByUserId(userId, device_id)

    if (!otpToken || otpToken?.token !== token) {
      throw new Error(ERROR_STATUES.INCORRECT_OTP_TOKEN.message, {
        cause: ERROR_STATUES.INCORRECT_OTP_TOKEN,
      })
    }

    await this.userService.updatePassword(userId, new_password)

    await this.userTokenRepo.deleteByUserId(userId, device_id)
  }
}

export default UserResetPasswordOperation
