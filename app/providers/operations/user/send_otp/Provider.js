import RegisterProvider from "../../../../common/RegisterProvider.js"
import UserSendOTPOperation from "./index.js"

const name = "UserSendOTPOperation"

class UserSendOTPOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const userService = slc.use("UserService")
    const userTokenRepo = slc.use("UserTokenRepository")

    return new UserSendOTPOperation(userService, userTokenRepo)
  }
}

export default new UserSendOTPOperationRegisterProvider({ name, implementationName: UserSendOTPOperation.name })
