import { Resend } from "resend"

import { ERROR_STATUES } from "../../../../constants/errors.js"

class UserSendOTPOperation {
  constructor(userService, userTokenRepo) {
    this.userService = userService
    this.userTokenRepo = userTokenRepo

    this.transporter = new Resend(process.env.SERVICE_MAIL_KEY)
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

    await this.sendOtpNotification(user.email, otpToken.token)
  }

  async sendOtpNotification(toEmail, otpToken) {
    const mailOptions = {
      from: "Acme <onboarding@resend.dev>",
      to: toEmail,
      subject: "OTP to Reset password",
      html: `<p>Congrats on sending your ${otpToken} <strong>first email</strong>!</p>`,
    }

    const { data, error } = await this.transporter.emails.send(mailOptions)
    if (error) return console.error({ error })
    console.log({ data })
  }
}

export default UserSendOTPOperation
