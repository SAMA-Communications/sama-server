import { Resend } from "resend"

import { ERROR_STATUES } from "../constants/errors.js"

class OTPSender {
  constructor() {
    try {
      this.transporter = new Resend(process.env.RESEND_API_KEY)
    } catch (err) {
      console.log("[OTPSender.error]", err)
    }
  }

  async sendOtpNotification(toEmail, otpToken) {
    if (!this.transporter) {
      throw new Error(ERROR_STATUES.MISSING_OTP_SENDER_SERVICE.message, {
        cause: ERROR_STATUES.MISSING_OTP_SENDER_SERVICE,
      })
    }

    const mailOptions = {
      from: process.env.RESEND_SENDER,
      to: toEmail,
      subject: "Your One-Time Password (OTP) for Password Reset",
      html: `
      <p>Hello!</p>
      <p>Your one-time password (OTP) for resetting your password is:</p>
      <h2 style="letter-spacing:2px;">${otpToken}</h2>
      <p>Please enter this code in the appropriate field to verify your identity.</p>
      <p>If you did not request a password reset, you can safely ignore this email.</p>
      `,
    }

    const { data, error } = await this.transporter.emails.send(mailOptions)
    if (error) return console.error("[OTPSender.error]", { error })
    console.log("[OTPSender]", { data })
  }
}

export default new OTPSender()
