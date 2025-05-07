class MessageReactionsUpdatePublicFields {
  constructor(messageReactionObject) {
    this.mid = messageReactionObject.mid

    this.cid = messageReactionObject.cid
    this.c_type = messageReactionObject.c_type

    this.from = messageReactionObject.from

    this.add = messageReactionObject.add
    this.remove = messageReactionObject.remove
  }
}

export default MessageReactionsUpdatePublicFields
