import BasePushEvent from './base.js'

export default class CreateChatAlertEventOptions extends BasePushEvent {
  constructor(options, payload) {
    super()

    this.application_id = options.application_id
    this.account_id = options.account_id

    this.dialogId = options.dialogId
    this.messageId = options.messageId
    this.senderID = options.senderID
    this.offlineUsersIDs = options.offlineUsersIDs

    this.payload = payload
  }

  setRecipientIds(recipients) {
    this.offlineUsersIDs = recipients
  }
}