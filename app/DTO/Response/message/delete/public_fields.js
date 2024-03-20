class DeleteMessagesPublicFields {
  constructor(params) {
    this.ids = params.messageIds
    this.cid = params.cid
    this.from = params.from
    this.type = 'all'
  }
}

export default DeleteMessagesPublicFields
