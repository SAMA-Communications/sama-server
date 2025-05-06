import { CONSTANTS as MAIN_CONSTANTS } from "../../../../../constants/constants.js"

class HttpMessageEditOperation {
  constructor(sessionService, messageEditOperation) {
    this.sessionService = sessionService
    this.messageEditOperation = messageEditOperation
  }

  async perform(fakeWsSessionKey, payload) {
    const { organizationId, senderId, messageEdit: messageEditParams } = payload

    this.sessionService.addUserDeviceConnection(
      fakeWsSessionKey,
      organizationId,
      senderId,
      MAIN_CONSTANTS.HTTP_DEVICE_ID
    )

    const operationResponse = await this.messageEditOperation.perform(fakeWsSessionKey, messageEditParams)

    return operationResponse
  }
}

export default HttpMessageEditOperation
