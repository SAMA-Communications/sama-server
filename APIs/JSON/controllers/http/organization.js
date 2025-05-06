import BaseHttpController from "./base.js"

import ServiceLocatorContainer from "@sama/common/ServiceLocatorContainer.js"

import HttpResponse from "@sama/networking/models/HttpResponse.js"
import Response from "@sama/networking/models/Response.js"

class HttpOrganizationController extends BaseHttpController {
  async create(res, req) {
    const payload = res.parsedBody

    const response = new Response()

    const httpOrganizationCreateOperation = ServiceLocatorContainer.use("HttpOrganizationCreateOperation")
    const organization = await httpOrganizationCreateOperation.perform(res.fakeWsSessionKey, payload)

    return response.setHttpResponse(new HttpResponse(200, {}, { organization: organization.visibleParams() }))
  }
}

export default new HttpOrganizationController()
