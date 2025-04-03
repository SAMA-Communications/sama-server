class HttpActivityOnlineListOperation {
  constructor(sessionService, onlineListOperation) {
    this.sessionService = sessionService
    this.onlineListOperation = onlineListOperation
  }

  async perform(fakeWsSessionKey, payload) {
    const operationResponse = await this.onlineListOperation.perform(fakeWsSessionKey, payload)

    return operationResponse
  }
}

export default HttpActivityOnlineListOperation
