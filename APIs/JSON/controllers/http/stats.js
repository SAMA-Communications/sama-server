import BaseHttpController from "./base.js"

import ServiceLocatorContainer from "@sama/common/ServiceLocatorContainer.js"

import HttpResponse from "@sama/networking/models/HttpResponse.js"
import Response from "@sama/networking/models/Response.js"

class HttpServerStatsController extends BaseHttpController {
  async collectStats(res, req) {
    const payload = res.parsedQuery

    const response = new Response()

    const httpOrganizationCreateOperation = ServiceLocatorContainer.use("HttpStatsCollectOperation")
    const stats = await httpOrganizationCreateOperation.perform(res, payload)

    return response.setHttpResponse(new HttpResponse(200, {}, stats))
  }

  async collectServerStats(res, req) {
    const payload = res.parsedQuery

    const response = new Response()

    const httpOrganizationCreateOperation = ServiceLocatorContainer.use("HttpStatsCollectOperation")
    const stats = await httpOrganizationCreateOperation.perform(res, payload, true)

    return response.setHttpResponse(new HttpResponse(200, {}, stats))
  }
}

export default new HttpServerStatsController()
