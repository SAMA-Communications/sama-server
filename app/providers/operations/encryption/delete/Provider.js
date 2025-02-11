import RegisterProvider from "../../../../common/RegisterProvider.js"
import EncryptionDeleteOperation from "./index.js"

const name = "EncryptionDeleteOperation"

class EncryptionDeleteOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const encryptionService = slc.use("EncryptionService")
    const sessionService = slc.use("SessionService")
    const helpers = slc.use("Helpers")

    return new EncryptionDeleteOperation(encryptionService, sessionService, helpers)
  }
}

export default new EncryptionDeleteOperationRegisterProvider({
  name,
  implementationName: EncryptionDeleteOperation.name,
})
