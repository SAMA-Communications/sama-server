class OrganizationService {
  constructor(organizationRepo) {
    this.organizationRepo = organizationRepo
  }

  async create(params) {
    const organization = await this.organizationRepo.create(params)

    return organization
  }

  async isExist(orgId) {
    const organization = await this.organizationRepo.findById(orgId)

    return !!organization
  }
}

export default OrganizationService
