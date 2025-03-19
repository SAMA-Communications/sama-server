import RegisterProvider from "../../../common/RegisterProvider.js"
import EncryptedDevice from "../../../models/encrypted_device.js"
import EncryptionRepository from "./index.js"

const name = "EncryptionRepository"

class EncryptionRepositoryRegisterProvider extends RegisterProvider {
  register(slc) {
    const mongoConnection = slc.use("MongoConnection")
    const baseMapper = slc.use("BaseMapper")

    return new EncryptionRepository(mongoConnection, EncryptedDevice, baseMapper)
  }
}

export default new EncryptionRepositoryRegisterProvider({ name, implementationName: EncryptionRepository.name })
