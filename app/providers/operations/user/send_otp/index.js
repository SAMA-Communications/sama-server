import { ERROR_STATUES } from "../../../../constants/errors.js"

class UserSendOTPOperation {
  constructor(userService, userTokenRepo, otpSender) {
    this.userService = userService
    this.userTokenRepo = userTokenRepo
    this.otpSender = otpSender
  }

  async perform(ws, data) {
    const { organization_id, device_id, email } = data
    const user = await this.userService.findByEmail(organization_id, email)

    if (!user) {
      throw new Error(ERROR_STATUES.USER_NOT_FOUND.message, {
        cause: ERROR_STATUES.USER_NOT_FOUND,
      })
    }

    const otpToken = await this.userTokenRepo.upsertOTPToken(organization_id, user._id, device_id)

    await this.otpSender.sendOtpNotification(user.email, otpToken.token)
  }
}

export default UserSendOTPOperation
