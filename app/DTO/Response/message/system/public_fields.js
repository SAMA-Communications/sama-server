class SystemMessagePublicFields {
  constructor(systemMessageParams) {
    this._id = systemMessageParams.id
    this.from = systemMessageParams.from

    this.t = systemMessageParams.t
    this.x = systemMessageParams.x

    if (systemMessageParams.cid) {
      this.cid = systemMessageParams.cid
    }
  }
}

export default SystemMessagePublicFields
