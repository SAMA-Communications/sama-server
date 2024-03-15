class SystemMessage {
  constructor(params, cid) {
    this._id = params.id
    this.from = params.sender
    this.x = params.params
    this.t = params.time
    this.cid = cid
  }

  serialize() {
    const systemMessage = {
      _id: this._id,
      from: this.from,
      t: this.t,
      x: this.x
    }

    if (this.cid) {
      systemMessage.cid = this.cid
    }

    return systemMessage
  }
}

export default SystemMessage