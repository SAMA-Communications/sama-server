import RegisterProvider from '../../../../common/RegisterProvider.js'
import ConversationMapper from './index.js'

const name = 'ConversationMapper'

class ConversationMapperRegisterProvider extends RegisterProvider {
  register(slc) {
    return new ConversationMapper()
  }
}

export default new ConversationMapperRegisterProvider({ name, implementationName: ConversationMapper.name })