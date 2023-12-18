class Response {
  backMessages = []
  deliverMessages = []
  lastActivityStatus = null

  constructor(backMessages, deliverMessages, lastActivityStatus) {
    this.backMessages = backMessages ? backMessages : this.backMessages
    this.deliverMessages = deliverMessages ? deliverMessages : this.deliverMessages
    this.lastActivityStatus = lastActivityStatus ? lastActivityStatus : this.lastActivityStatus
  }

  addBackMessage(...messages) {
    this.backMessages.push(...messages)
    return this
  }

  addDeliverMessage(...messages) {
    this.deliverMessages.push(...messages)
    return this
  }

  updateLastActivityStatus(status) {
    this.lastActivityStatus = status
    return this
  }
}

export default Response