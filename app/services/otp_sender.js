import { Resend } from "resend"

class OTPSender {
  constructor() {
    this.transporter = new Resend(process.env.SERVICE_MAIL_KEY)
  }

  async sendOtpNotification(toEmail, otpToken) {
    const mailOptions = {
      from: "SAMASupport <onboarding@resend.dev>",
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
