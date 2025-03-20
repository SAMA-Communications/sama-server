class Response {
  backMessages = []
  deliverMessages = []
  lastActivityStatusResponse = null
  httpResponse = null

  constructor(backMessages, deliverMessages, lastActivityStatusResponse, httpResponse) {
    this.backMessages = this.backMessages.concat(backMessages || [])
    this.deliverMessages = this.deliverMessages.concat(deliverMessages || [])
    this.lastActivityStatusResponse = lastActivityStatusResponse
      ? lastActivityStatusResponse
      : this.lastActivityStatusResponse
    this.httpResponse = httpResponse ? httpResponse : this.httpResponse
  }

  merge(response) {
    this.backMessages = this.backMessages.concat(response.backMessages)
    this.deliverMessages = this.deliverMessages.concat(response.deliverMessages)

    if (response.lastActivityStatusResponse) {
      this.lastActivityStatusResponse = response.lastActivityStatusResponse
    }

    return this
  }

  addBackMessage(...messages) {
    this.backMessages.push(...messages)
    return this
  }

  addDeliverMessage(...messages) {
    this.deliverMessages.push(...messages)
    return this
  }

  updateLastActivityStatus(statusResponse) {
    this.lastActivityStatusResponse = statusResponse
    return this
  }

  setHttpResponse(httpResponse) {
    this.httpResponse = httpResponse
    return this
  }
}

export default Response
