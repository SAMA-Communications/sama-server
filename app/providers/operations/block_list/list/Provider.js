import RegisterProvider from '../../../../common/RegisterProvider.js'
import BlockListRetrieveOperation from './index.js'

const name = 'BlockListRetrieveOperation'

class BlockListRetrieveOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use('SessionService')
    const blockListService = slc.use('BlockListService')

    return new BlockListRetrieveOperation(sessionService, blockListService)
  }
}

export default new BlockListRetrieveOperationRegisterProvider({ name, implementationName: BlockListRetrieveOperation.name })