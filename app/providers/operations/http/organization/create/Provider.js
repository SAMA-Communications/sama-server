import RegisterProvider from "../../../../../common/RegisterProvider.js"
import HttpOrganizationCreateOperation from "./index.js"

const name = "HttpOrganizationCreateOperation"

class HttpOrganizationCreateOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const organizationService = slc.use("OrganizationService")

    return new HttpOrganizationCreateOperation(organizationService)
  }
}

export default new HttpOrganizationCreateOperationRegisterProvider({
  name,
  implementationName: HttpOrganizationCreateOperation.name,
  scope: RegisterProvider.SCOPE.TRANSIENT,
})
