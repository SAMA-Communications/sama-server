class EditMessagePublicFields {
  constructor(params) {
    this.id = params.messageId

    this.cid = params.cid
    this.c_type = params.c_type

    this.from = params.from

    this.body = params.body
  }
}

export default EditMessagePublicFields
