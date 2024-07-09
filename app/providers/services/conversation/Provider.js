import RegisterProvider from "../../../common/RegisterProvider.js"
import ConversationService from "./index.js"

const name = "ConversationService"

class ConversationServiceRegisterProvider extends RegisterProvider {
  register(slc) {
    const storageService = slc.use("StorageService")
    const conversationRepo = slc.use("ConversationRepository")
    const conversationParticipantRepo = slc.use("ConversationParticipantRepository")

    return new ConversationService(conversationRepo, conversationParticipantRepo, storageService)
  }
}

export default new ConversationServiceRegisterProvider({ name, implementationName: ConversationService.name })
