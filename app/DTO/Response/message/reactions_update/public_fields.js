class MessageReactionsUpdatePublicFields {
  constructor(messageReactionObject) {
    this.mid = messageReactionObject.mid

    this.cid = messageReactionObject.cid
    this.c_type = messageReactionObject.c_type

    this.from = messageReactionObject.from

    if (messageReactionObject.add) {
      this.add = messageReactionObject.add
    }
    if (messageReactionObject.remove) {
      this.remove = messageReactionObject.remove
    }
  }
}

export default MessageReactionsUpdatePublicFields
