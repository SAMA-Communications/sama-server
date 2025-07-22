import RegisterProvider from "../../../../common/RegisterProvider.js"
import BlockListUnblockOperation from "./index.js"

const name = "BlockListUnblockOperation"

class BlockListUnblockOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const blockListService = slc.use("BlockListService")

    return new BlockListUnblockOperation(sessionService, blockListService)
  }
}

export default new BlockListUnblockOperationRegisterProvider({
  name,
  implementationName: BlockListUnblockOperation.name,
  scope: RegisterProvider.SCOPE.TRANSIENT,
})
