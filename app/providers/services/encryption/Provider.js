import RegisterProvider from "../../../common/RegisterProvider.js"
import EncryptionService from "./index.js"

const name = "EncryptionService"

class EncryptionServiceRegisterProvider extends RegisterProvider {
  register(slc) {
    const encryptionRepo = slc.use("EncryptionRepository")

    return new EncryptionService(encryptionRepo)
  }
}

export default new EncryptionServiceRegisterProvider({ name, implementationName: EncryptionService.name })
