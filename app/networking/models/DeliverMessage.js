class DeliverMessage {
  ws = null
  userIds = []
  packet = null
  notSaveInOfflineStorage = false

  constructor(userIds, packet, notSaveInOfflineStorage, ws) {
    this.userIds = userIds
    this.packet = packet
    this.notSaveInOfflineStorage = !!notSaveInOfflineStorage
    this.ws = ws
  }
}

export default DeliverMessage