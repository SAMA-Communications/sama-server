import RegisterProvider from "../../../common/RegisterProvider.js"
import Contact from "../../../models/contact.js"
import ContactRepository from "./index.js"

const name = "ContactRepository"

class ContactRepositoryRegisterProvider extends RegisterProvider {
  register(slc) {
    const mongoConnection = slc.use("MongoConnection")
    const baseMapper = slc.use("BaseMapper")

    return new ContactRepository(mongoConnection, Contact, baseMapper)
  }
}

export default new ContactRepositoryRegisterProvider({ name, implementationName: ContactRepository.name })
