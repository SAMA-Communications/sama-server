class DeliverMessage {
  ws = null
  userIds = []
  packet = null
  notSaveInOfflineStorage = false
  pushMessage = null

  constructor(userIds, packet, notSaveInOfflineStorage, ws) {
    this.userIds = userIds
    this.packet = packet
    this.notSaveInOfflineStorage = !!notSaveInOfflineStorage
    this.ws = ws
  }

  addPushMessage(pushMessage) {
    this.pushMessage = pushMessage
    return this
  }
}

export default DeliverMessage