import RegisterProvider from "../../../common/RegisterProvider.js"
import ContactService from "./index.js"

const name = "ContactService"

class ContactServiceRegisterProvider extends RegisterProvider {
  register(slc) {
    const contactRepo = slc.use("ContactRepository")
    const userRepo = slc.use("UserRepository")

    return new ContactService(contactRepo, userRepo)
  }
}

export default new ContactServiceRegisterProvider({ name, implementationName: ContactService.name })
