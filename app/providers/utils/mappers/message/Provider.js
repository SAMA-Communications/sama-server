import RegisterProvider from '../../../../common/RegisterProvider.js'
import messageMapper from './index.js'

const name = 'MessageMapper'

class MessageMapperRegisterProvider extends RegisterProvider {
  register(slc) {
    return messageMapper
  }
}

export default new MessageMapperRegisterProvider({ name, implementationName: messageMapper.name })