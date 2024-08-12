import RegisterProvider from "../../../../common/RegisterProvider.js"
import EncryptionRegisterOperation from "./index.js"

const name = "EncryptionRegisterOperation"

class EncryptionRegisterOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const encryptionService = slc.use("EncryptionService")

    return new EncryptionRegisterOperation(encryptionService)
  }
}

export default new EncryptionRegisterOperationRegisterProvider({
  name,
  implementationName: EncryptionRegisterOperation.name,
})
