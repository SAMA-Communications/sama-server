import { CONSTANTS as MAIN_CONSTANTS } from "../../../../../constants/constants.js"

class HttpMessageReadOperation {
  constructor(sessionService, messageReadOperation) {
    this.sessionService = sessionService
    this.messageReadOperation = messageReadOperation
  }

  async perform(fakeWsSessionKey, payload) {
    const { organizationId, senderId, messageRead: messageReadParams } = payload

    this.sessionService.addUserDeviceConnection(
      fakeWsSessionKey,
      organizationId,
      senderId,
      MAIN_CONSTANTS.HTTP_DEVICE_ID
    )

    const operationResponse = await this.messageReadOperation.perform(fakeWsSessionKey, messageReadParams)

    return operationResponse
  }
}

export default HttpMessageReadOperation
