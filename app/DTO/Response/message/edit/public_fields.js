class EditMessagePublicFields {
  constructor(params) {
    this.id = params.messageId
    this.body = params.body
    this.from = params.from
  }
}

export default EditMessagePublicFields
