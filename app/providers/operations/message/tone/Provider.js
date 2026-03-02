import RegisterProvider from "../../../../common/RegisterProvider.js"
import MessageToneOperation from "./index.js"

const name = "MessageToneOperation"

class MessageToneOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const config = slc.use("Config")

    const mainLogger = slc.use("Logger")
    const logger = mainLogger.child("[MessageTonOp]")

    const messageService = slc.use("MessageService")

    return new MessageToneOperation(config, logger, messageService)
  }
}

export default new MessageToneOperationRegisterProvider({ name, implementationName: MessageToneOperation.name })
