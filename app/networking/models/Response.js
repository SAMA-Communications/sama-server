class Response {
  backMessages = []
  deliverMessages = []
  lastActivityStatusResponse = null

  constructor(backMessages, deliverMessages, lastActivityStatusResponse) {
    this.backMessages = this.backMessages.concat(backMessages || [])
    this.deliverMessages = this.deliverMessages.concat(deliverMessages || [])
    this.lastActivityStatusResponse = lastActivityStatusResponse ? lastActivityStatusResponse : this.lastActivityStatusResponse
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
}

export default Response