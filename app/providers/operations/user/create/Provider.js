import RegisterProvider from "../../../../common/RegisterProvider.js"
import UserCreateOperation from "./index.js"

const name = "UserCreateOperation"

class UserCreateOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const orgService = slc.use("OrganizationService")
    const userService = slc.use("UserService")
    const contactService = slc.use("ContactService")

    return new UserCreateOperation(orgService, userService, contactService)
  }
}

export default new UserCreateOperationRegisterProvider({ name, implementationName: UserCreateOperation.name })
