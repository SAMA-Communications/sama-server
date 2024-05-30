import RegisterProvider from "../../../common/RegisterProvider.js"
import UserToken from "../../../new_models/user_token.js"
import UserTokenRepository from "./index.js"

const name = "UserTokenRepository"

class UserTokenRepositoryRegisterProvider extends RegisterProvider {
  register(slc) {
    const mongoConnection = slc.use("MongoConnection")
    const baseMapper = slc.use("BaseMapper")

    return new UserTokenRepository(mongoConnection, UserToken, baseMapper)
  }
}

export default new UserTokenRepositoryRegisterProvider({ name, implementationName: UserTokenRepository.name })
