import { CONSTANTS as MAIN_CONSTANTS } from "../../../../../constants/constants.js"

class HttpMessageDeleteOperation {
  constructor(sessionService, messageDeleteOperation) {
    this.sessionService = sessionService
    this.messageDeleteOperation = messageDeleteOperation
  }

  async perform(fakeWsSessionKey, payload) {
    const { organizationId, senderId, messageDelete: messageDeleteParams } = payload

    this.sessionService.addUserDeviceConnection(
      fakeWsSessionKey,
      organizationId,
      senderId,
      MAIN_CONSTANTS.HTTP_DEVICE_ID
    )

    const operationResponse = await this.messageDeleteOperation.perform(fakeWsSessionKey, messageDeleteParams)

    return operationResponse
  }
}

export default HttpMessageDeleteOperation
