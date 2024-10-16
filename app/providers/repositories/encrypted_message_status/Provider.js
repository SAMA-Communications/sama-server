import RegisterProvider from "../../../common/RegisterProvider.js"
import EncryptedMessageStatus from "../../../new_models/encrypted_message_status.js"
import EncryptedMessageStatusRepository from "./index.js"

const name = "EncryptedMessageStatusRepository"

class EncryptedMessageStatusRepositoryRegisterProvider extends RegisterProvider {
  register(slc) {
    const mongoConnection = slc.use("MongoConnection")
    const baseMapper = slc.use("BaseMapper")

    return new EncryptedMessageStatusRepository(mongoConnection, EncryptedMessageStatus, baseMapper)
  }
}

export default new EncryptedMessageStatusRepositoryRegisterProvider({
  name,
  implementationName: EncryptedMessageStatusRepository.name,
})
