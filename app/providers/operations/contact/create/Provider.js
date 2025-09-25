import RegisterProvider from "../../../../common/RegisterProvider.js"
import ContactAddOperation from "./index.js"

const name = "ContactAddOperation"

class ContactAddOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const contactService = slc.use("ContactService")

    return new ContactAddOperation(sessionService, contactService)
  }
}

export default new ContactAddOperationRegisterProvider({
  name,
  implementationName: ContactAddOperation.name,
  scope: RegisterProvider.SCOPE.TRANSIENT,
})
