import RegisterProvider from "../../../common/RegisterProvider.js"
import EncryptedMessageStatusService from "./index.js"

const name = "EncryptedMessageStatusService"

class EncryptedMessageStatusServiceRegisterProvider extends RegisterProvider {
  register(slc) {
    const encryptionRepo = slc.use("EncryptionRepository")
    const encryptedMessageStatusRepo = slc.use("EncryptedMessageStatusRepository")

    return new EncryptedMessageStatusService(encryptionRepo, encryptedMessageStatusRepo)
  }
}

export default new EncryptedMessageStatusServiceRegisterProvider({
  name,
  implementationName: EncryptedMessageStatusService.name,
})
