import RegisterProvider from "../../../../common/RegisterProvider.js"
import UserSendOTPOperation from "./index.js"

const name = "UserSendOTPOperation"

class UserSendOTPOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const userService = slc.use("UserService")
    const userTokenRepo = slc.use("UserTokenRepository")
    const otpSender = slc.use("OptSender")

    return new UserSendOTPOperation(userService, userTokenRepo, otpSender)
  }
}

export default new UserSendOTPOperationRegisterProvider({ name, implementationName: UserSendOTPOperation.name })
