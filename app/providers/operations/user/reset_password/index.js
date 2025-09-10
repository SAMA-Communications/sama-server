import { ERROR_STATUES } from "../../../../constants/errors.js"

class UserResetPasswordOperation {
  constructor(userService, userTokenRepo) {
    this.userService = userService
    this.userTokenRepo = userTokenRepo
  }

  async perform(ws, data) {
    const { organization_id, email, device_id, token, new_password } = data
    const user = await this.userService.findByEmail(organization_id, email)

    if (!user) {
      throw new Error(ERROR_STATUES.USER_NOT_FOUND.message, {
        cause: ERROR_STATUES.USER_NOT_FOUND,
      })
    }

    const otpToken = await this.userTokenRepo.findTokenByUserId(user.native_id, device_id, token)

    if (!otpToken) {
      throw new Error(ERROR_STATUES.INCORRECT_OTP_TOKEN.message, {
        cause: ERROR_STATUES.INCORRECT_OTP_TOKEN,
      })
    }

    await this.userService.updatePassword(user.native_id, new_password)
  }
}

export default UserResetPasswordOperation
