import RegisterProvider from "../../../../common/RegisterProvider.js"
import ContactListOperation from "./index.js"

const name = "ContactListOperation"

class ContactListOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const contactService = slc.use("ContactService")

    return new ContactListOperation(sessionService, contactService)
  }
}

export default new ContactListOperationRegisterProvider({ name, implementationName: ContactListOperation.name })
