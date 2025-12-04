import RegisterProvider from "../../../../common/RegisterProvider.js"
import EncryptionRegisterOperation from "./index.js"

const name = "EncryptionRegisterOperation"

class EncryptionRegisterOperationProvider extends RegisterProvider {
  register(slc) {
    const encryptionService = slc.use("EncryptionService")
    const sessionService = slc.use("SessionService")

    return new EncryptionRegisterOperation(encryptionService, sessionService)
  }
}

export default new EncryptionRegisterOperationProvider({
  name,
  implementationName: EncryptionRegisterOperation.name,
})
