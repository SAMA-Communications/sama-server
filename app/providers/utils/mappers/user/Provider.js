import RegisterProvider from "../../../../common/RegisterProvider.js"
import UserMapper from "./index.js"

const name = "UserMapper"

class UserMapperRegisterProvider extends RegisterProvider {
  register(slc) {
    return new UserMapper()
  }
}

export default new UserMapperRegisterProvider({ name, implementationName: UserMapper.name })
