import BasePushEvent from "./base.js"

export default class CreatePushEventOptions extends BasePushEvent {
  constructor(senderId, payload, options) {
    super()

    this.user_id = senderId

    this.payload = payload

    this.user_ids = options.user_ids
  }

  setRecipientIds(recipients) {
    this.user_ids = recipients
  }
}
