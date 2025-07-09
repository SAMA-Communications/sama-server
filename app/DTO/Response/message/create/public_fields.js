class MessagePublicFields {
  constructor(messageModel) {
    this._id = messageModel._id

    this.cid = messageModel.cid
    this.c_type = messageModel.x?.c_type
    delete messageModel.x?.c_type

    this.from = messageModel.from

    this.t = messageModel.t
    this.body = messageModel.body
    this.attachments = messageModel.attachments
    this.x = messageModel.x
    this.replied_message_id = messageModel.replied_message_id
    this.forwarded_message_id = messageModel.forwarded_message_id

    this.created_at = messageModel.created_at

    this.status = messageModel.status
    this.reactions = messageModel.reactions
  }
}

export default MessagePublicFields
