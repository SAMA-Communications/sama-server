import RegisterProvider from '../../../../common/RegisterProvider.js'
import conversationMapper from './index.js'

const name = 'ConversationMapper'

class ConversationMapperRegisterProvider extends RegisterProvider {
  register(slc) {
    return conversationMapper
  }
}

export default new ConversationMapperRegisterProvider({ name, implementationName: conversationMapper.name })