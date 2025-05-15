import RegisterProvider from "../../../common/RegisterProvider.js"
import Organization from "../../../models/organization.js"
import OrganizationRepository from "./index.js"

const name = "OrganizationRepository"

class OrganizationRepositoryRegisterProvider extends RegisterProvider {
  register(slc) {
    const mongoConnection = slc.use("MongoConnection")
    const baseMapper = slc.use("BaseMapper")

    return new OrganizationRepository(mongoConnection, Organization, baseMapper)
  }
}

export default new OrganizationRepositoryRegisterProvider({ name, implementationName: OrganizationRepository.name })
