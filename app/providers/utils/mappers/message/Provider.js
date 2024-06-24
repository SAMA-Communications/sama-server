import RegisterProvider from "../../../../common/RegisterProvider.js"
import MessageMapper from "./index.js"

const name = "MessageMapper"

class MessageMapperRegisterProvider extends RegisterProvider {
  register(slc) {
    return new MessageMapper()
  }
}

export default new MessageMapperRegisterProvider({ name, implementationName: MessageMapper.name })
