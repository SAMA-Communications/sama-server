import { CONSTANTS as MAIN_CONSTANTS } from "../../../../../constants/constants.js"

class HttpMessageSendSystemOperation {
  constructor(sessionService, messageSendSystemOperation) {
    this.sessionService = sessionService
    this.messageSendSystemOperation = messageSendSystemOperation
  }

  async perform(fakeWsSessionKey, payload) {
    const { senderId, messageSystem: systemMessageParams } = payload

    this.sessionService.addUserDeviceConnection(fakeWsSessionKey, senderId, MAIN_CONSTANTS.HTTP_DEVICE_ID)

    const operationResponse = await this.messageSendSystemOperation.perform(fakeWsSessionKey, systemMessageParams)

    return operationResponse
  }
}

export default HttpMessageSendSystemOperation
