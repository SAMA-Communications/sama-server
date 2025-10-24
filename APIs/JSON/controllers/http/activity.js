import BaseHttpController from "./base.js"

import ServiceLocatorContainer from "@sama/common/ServiceLocatorContainer.js"

import HttpResponse from "@sama/networking/models/HttpResponse.js"
import Response from "@sama/networking/models/Response.js"

class HttpActivityController extends BaseHttpController {
  async online_list(res, req) {
    const payload = res.parsedBody
    const { count: isCountRequest } = payload

    const response = new Response()

    const HttpActivityOnlineListOperation = ServiceLocatorContainer.use("HttpActivityOnlineListOperation")
    const onlineListResponse = await HttpActivityOnlineListOperation.perform(res.fakeWsSessionKey, payload)

    const responsePayload = isCountRequest ? { count: onlineListResponse } : { users: onlineListResponse }

    return response.setHttpResponse(new HttpResponse(200, {}, responsePayload))
  }
}

export default new HttpActivityController()
