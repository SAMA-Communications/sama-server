import { Resend } from "resend"

import { ERROR_STATUES } from "../constants/errors.js"
import config from "../config/index.js"
import mainLogger from "../logger/index.js"

const logger = mainLogger.child("[OTPSender]")

class OTPSender {
  constructor() {
    try {
      const apiKey = config.get("resend.apiKey")
      if (apiKey) {
        this.transporter = new Resend(apiKey)
      }
    } catch (err) {
      logger.error(err, "[init][error]")
    }
  }

  async sendOtpNotification(toEmail, otpToken) {
    if (!this.transporter) {
      throw new Error(ERROR_STATUES.MISSING_OTP_SENDER_SERVICE.message, {
        cause: ERROR_STATUES.MISSING_OTP_SENDER_SERVICE,
      })
    }

    const sender = config.get("resend.sender")

    const mailOptions = {
      from: sender,
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
    if (error) return logger.error(error, '[error]')
    logger.debug("[date]: %j", data)
  }
}

export default OTPSender
