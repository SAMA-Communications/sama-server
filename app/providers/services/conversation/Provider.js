import RegisterProvider from "../../../common/RegisterProvider.js"
import ConversationService from "./index.js"

const name = "ConversationService"

class ConversationServiceRegisterProvider extends RegisterProvider {
  register(slc) {
    const config = slc.use("Config")
    const helpers = slc.use("Helpers")
    const storageService = slc.use("StorageService")
    const conversationRepo = slc.use("ConversationRepository")
    const conversationParticipantRepo = slc.use("ConversationParticipantRepository")

    return new ConversationService(config, helpers, storageService, conversationRepo, conversationParticipantRepo)
  }
}

export default new ConversationServiceRegisterProvider({ name, implementationName: ConversationService.name })
