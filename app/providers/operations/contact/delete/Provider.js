import RegisterProvider from "../../../../common/RegisterProvider.js"
import ContactDeleteOperation from "./index.js"

const name = "ContactDeleteOperation"

class ContactDeleteOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const contactService = slc.use("ContactService")

    return new ContactDeleteOperation(sessionService, contactService)
  }
}

export default new ContactDeleteOperationRegisterProvider({
  name,
  implementationName: ContactDeleteOperation.name,
  scope: RegisterProvider.SCOPE.TRANSIENT,
})
