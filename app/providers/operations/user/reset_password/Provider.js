import RegisterProvider from "../../../../common/RegisterProvider.js"
import UserResetPasswordOperation from "./index.js"

const name = "UserResetPasswordOperation"

class UserResetPasswordOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const userService = slc.use("UserService")
    const userTokenRepo = slc.use("UserTokenRepository")

    return new UserResetPasswordOperation(userService, userTokenRepo)
  }
}

export default new UserResetPasswordOperationRegisterProvider({
  name,
  implementationName: UserResetPasswordOperation.name,
})
