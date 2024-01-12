class DeliverMessage {
  ws = null
  userIds = []
  packet = null
  notSaveInOfflineStorage = false
  pushQueueMessage = null

  constructor(userIds, packet, notSaveInOfflineStorage, ws) {
    this.userIds = userIds
    this.packet = packet
    this.notSaveInOfflineStorage = !!notSaveInOfflineStorage
    this.ws = ws
  }

  addPushQueueMessage(pushQueueMessage) {
    this.pushQueueMessage = pushQueueMessage
    return this
  }
}

export default DeliverMessage