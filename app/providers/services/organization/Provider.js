import OrganizationService from "./index.js"
import RegisterProvider from "../../../common/RegisterProvider.js"

const name = "OrganizationService"

class OrganizationServiceRegisterProvider extends RegisterProvider {
  register(slc) {
    const organizationRepo = slc.use("OrganizationRepository")

    return new OrganizationService(organizationRepo)
  }
}

export default new OrganizationServiceRegisterProvider({ name, implementationName: OrganizationService.name })
