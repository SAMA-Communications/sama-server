import { CONSTANTS as MAIN_CONSTANTS } from "../../../../../constants/constants.js"

class HttpActivityOnlineListOperation {
  constructor(sessionService, onlineListOperation) {
    this.sessionService = sessionService
    this.onlineListOperation = onlineListOperation
  }

  async perform(fakeWsSessionKey, payload) {
    const { organizationId, userId, ...requestData } = payload

    this.sessionService.addUserDeviceConnection(fakeWsSessionKey, organizationId, userId, MAIN_CONSTANTS.HTTP_DEVICE_ID)

    const operationResponse = await this.onlineListOperation.perform(fakeWsSessionKey, requestData)

    return operationResponse
  }
}

export default HttpActivityOnlineListOperation
