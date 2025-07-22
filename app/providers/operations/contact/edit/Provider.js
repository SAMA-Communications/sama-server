import RegisterProvider from "../../../../common/RegisterProvider.js"
import ContactEditOperation from "./index.js"

const name = "ContactEditOperation"

class ContactEditOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const contactService = slc.use("ContactService")

    return new ContactEditOperation(sessionService, contactService)
  }
}

export default new ContactEditOperationRegisterProvider({
  name,
  implementationName: ContactEditOperation.name,
  scope: RegisterProvider.SCOPE.TRANSIENT,
})
