import { CONSTANTS as MAIN_CONSTANTS } from "../../../../../constants/constants.js"

class HttpActivityOnlineListOperation {
  constructor(sessionService, onlineListOperation) {
    this.sessionService = sessionService
    this.onlineListOperation = onlineListOperation
  }

  async perform(res, payload) {
    const { organizationId, userId, ...requestData } = payload

    this.sessionService.addUserDeviceConnection(res, organizationId, userId, MAIN_CONSTANTS.HTTP_DEVICE_ID)

    const operationResponse = await this.onlineListOperation.perform(res, requestData)

    return operationResponse
  }
}

export default HttpActivityOnlineListOperation
