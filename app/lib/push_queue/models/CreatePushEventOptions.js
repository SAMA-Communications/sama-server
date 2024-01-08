import BasePushEvent from './base.js'

export default class CreatePushEventOptions extends BasePushEvent {
  constructor(senderId, payload, options) {
    super()

    this.user_id = senderId
    
    this.payload = payload

    this.application_id = options.application_id
    this.account_id = options.account_id
    this.user_ids = options.user_ids
  }

  setRecipientIds(recipients) {
    this.user_ids = recipients
  }
}