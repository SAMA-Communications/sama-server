class OrganizationService {
  constructor(organizationRepo) {
    this.organizationRepo = organizationRepo
  }

  async create(params) {
    const organization = await this.organizationRepo.create(params)

    return organization
  }
}

export default OrganizationService
