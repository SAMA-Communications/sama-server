import { CONSTANTS as MAIN_CONSTANTS } from "../../../../../constants/constants.js"

class HttpMessageSendSystemOperation {
  constructor(sessionService, messageSendSystemOperation) {
    this.sessionService = sessionService
    this.messageSendSystemOperation = messageSendSystemOperation
  }

  async perform(res, payload) {
    const { organizationId, senderId, messageSystem: systemMessageParams } = payload

    this.sessionService.addUserDeviceConnection(res, organizationId, senderId, MAIN_CONSTANTS.HTTP_DEVICE_ID)

    const operationResponse = await this.messageSendSystemOperation.perform(res, systemMessageParams)

    return operationResponse
  }
}

export default HttpMessageSendSystemOperation
