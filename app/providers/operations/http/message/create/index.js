import { CONSTANTS as MAIN_CONSTANTS } from "../../../../../constants/constants.js"

class HttpMessageCreateOperation {
  constructor(sessionService, messageCreateOperation) {
    this.sessionService = sessionService
    this.messageCreateOperation = messageCreateOperation
  }

  async perform(res, payload) {
    const { organizationId, senderId, message: messageParams } = payload

    await this.sessionService.addUserDeviceConnection(res, organizationId, senderId, MAIN_CONSTANTS.HTTP_DEVICE_ID)

    const operationResponse = await this.messageCreateOperation.perform(res, messageParams)

    return operationResponse
  }
}

export default HttpMessageCreateOperation
