import RegisterProvider from "../../../../common/RegisterProvider.js"
import BlockListBlockOperation from "./index.js"

const name = "BlockListBlockOperation"

class BlockListBlockOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const blockListService = slc.use("BlockListService")

    return new BlockListBlockOperation(sessionService, blockListService)
  }
}

export default new BlockListBlockOperationRegisterProvider({ name, implementationName: BlockListBlockOperation.name })
