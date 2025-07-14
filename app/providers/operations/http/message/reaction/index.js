import { CONSTANTS as MAIN_CONSTANTS } from "../../../../../constants/constants.js"

class HttpMessageReactionOperation {
  constructor(sessionService, messageReactionsUpdateOperation) {
    this.sessionService = sessionService
    this.messageReactionsUpdateOperation = messageReactionsUpdateOperation
  }

  async perform(fakeWsSessionKey, payload) {
    const { organizationId, senderId, messageReaction: messageReaction } = payload

    this.sessionService.addUserDeviceConnection(fakeWsSessionKey, organizationId, senderId, MAIN_CONSTANTS.HTTP_DEVICE_ID)

    const operationResponse = await this.messageReactionsUpdateOperation.perform(fakeWsSessionKey, messageReaction)

    return operationResponse
  }
}

export default HttpMessageReactionOperation
