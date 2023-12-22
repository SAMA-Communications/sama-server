class Response {
  backMessages = []
  deliverMessages = []
  lastActivityStatus = null

  constructor(backMessages, deliverMessages, lastActivityStatus) {
    this.backMessages = this.backMessages.concat(backMessages || [])
    this.deliverMessages = this.deliverMessages.concat(deliverMessages || [])
    this.lastActivityStatus = lastActivityStatus ? lastActivityStatus : this.lastActivityStatus
  }

  merge(response) {
    this.backMessages = this.backMessages.concat(response.backMessages)
    this.deliverMessages = this.deliverMessages.concat(response.deliverMessages)

    if (response.lastActivityStatus) {
      this.lastActivityStatus = response.lastActivityStatus
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

  updateLastActivityStatus(status) {
    this.lastActivityStatus = status
    return this
  }
}

export default Response