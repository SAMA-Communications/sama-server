import { CONSTANTS as MAIN_CONSTANTS } from "../../../../../constants/constants.js"

class HttpMessageCreateOperation {
  constructor(sessionService, messageCreateOperation) {
    this.sessionService = sessionService
    this.messageCreateOperation = messageCreateOperation
  }

  async perform(fakeWsSessionKey, createMessageParams) {
    const { senderId, message: messageParams } = createMessageParams

    this.sessionService.addUserDeviceConnection(fakeWsSessionKey, senderId, MAIN_CONSTANTS.HTTP_DEVICE_ID)

    const operationResponse = await this.messageCreateOperation.perform(fakeWsSessionKey, messageParams)

    return operationResponse
  }
}

export default HttpMessageCreateOperation
