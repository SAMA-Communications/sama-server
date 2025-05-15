import RequestOrganizationCreateDTO from "@sama/DTO/Request/http/organization/create/index.js"

class HttpOrganizationCreateOperation {
  constructor(organizationService) {
    this.organizationService = organizationService
  }

  async perform(fakeWsSessionKey, payload) {
    const organizationCreateDTO = new RequestOrganizationCreateDTO(payload)

    const organization = await this.organizationService.create(organizationCreateDTO)

    return organization
  }
}

export default HttpOrganizationCreateOperation
