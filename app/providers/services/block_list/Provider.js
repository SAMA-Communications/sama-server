import RegisterProvider from "../../../common/RegisterProvider.js"
import BlockListService from "./index.js"

const name = "BlockListService"

class BlockListServiceRegisterProvider extends RegisterProvider {
  register(slc) {
    const helpers = slc.use("Helpers")
    const blockedUserRepo = slc.use("BlockedUserRepository")

    return new BlockListService(helpers, blockedUserRepo)
  }
}

export default new BlockListServiceRegisterProvider({ name, implementationName: BlockListService.name })
