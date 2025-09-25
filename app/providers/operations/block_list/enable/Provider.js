import RegisterProvider from "../../../../common/RegisterProvider.js"
import BlockListEnableOperation from "./index.js"

const name = "BlockListEnableOperation"

class BlockListEnableOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const blockListService = slc.use("BlockListService")

    return new BlockListEnableOperation(sessionService, blockListService)
  }
}

export default new BlockListEnableOperationRegisterProvider({
  name,
  implementationName: BlockListEnableOperation.name,
  scope: RegisterProvider.SCOPE.TRANSIENT,
})
