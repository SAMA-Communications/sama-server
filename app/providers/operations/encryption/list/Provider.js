import RegisterProvider from "../../../../common/RegisterProvider.js"
import EncryptionListOperation from "./index.js"

const name = "EncryptionListOperation"

class EncryptionListOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const encryptionService = slc.use("EncryptionService")
    const sessionService = slc.use("SessionService")
    const userRepo = slc.use("UserRepository")

    return new EncryptionListOperation(encryptionService, sessionService, userRepo)
  }
}

export default new EncryptionListOperationRegisterProvider({
  name,
  implementationName: EncryptionListOperation.name,
})
