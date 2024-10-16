import RegisterProvider from "../../../../common/RegisterProvider.js"
import EncryptionRequestKeysOperation from "./index.js"

const name = "EncryptionRequestKeysOperation"

class EncryptionRequestKeysOperationProvider extends RegisterProvider {
  register(slc) {
    const userRepo = slc.use("UserRepository")
    const encryptionService = slc.use("EncryptionService")

    return new EncryptionRequestKeysOperation(encryptionService, userRepo)
  }
}

export default new EncryptionRequestKeysOperationProvider({
  name,
  implementationName: EncryptionRequestKeysOperation.name,
})
