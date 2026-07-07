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

  async isUserFromBlocked(user) {
    const organization = await this.organizationRepo.findById(user.organization_id)

    return { isBlocked: organization?.is_blocked, reason: organization?.block_reason }
  }
}

export default OrganizationService
