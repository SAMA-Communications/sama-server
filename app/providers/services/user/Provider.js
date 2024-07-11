import RegisterProvider from "../../../common/RegisterProvider.js"
import UserService from "./index.js"

const name = "UserService"

class UserServiceRegisterProvider extends RegisterProvider {
  register(slc) {
    const userRepo = slc.use("UserRepository")
    const storageService = slc.use("StorageService")

    return new UserService(userRepo, storageService)
  }
}

export default new UserServiceRegisterProvider({ name, implementationName: UserService.name })
