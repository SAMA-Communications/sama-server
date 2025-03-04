import RegisterProvider from "../../../common/RegisterProvider.js"
import BlockedUser from "../../../models/blocked_user.js"
import BlockedUserRepository from "./index.js"

const name = "BlockedUserRepository"

class BlockedUserRepositoryRegisterProvider extends RegisterProvider {
  register(slc) {
    const mongoConnection = slc.use("MongoConnection")
    const baseMapper = slc.use("BaseMapper")

    return new BlockedUserRepository(mongoConnection, BlockedUser, baseMapper)
  }
}

export default new BlockedUserRepositoryRegisterProvider({ name, implementationName: BlockedUserRepository.name })
