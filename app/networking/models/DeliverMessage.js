class DeliverMessage {
  ws = null

  orgId = null

  userIds = []

  cId = null
  exceptUserIds = []

  packet = null
  notSaveInOfflineStorage = false
  pushQueueMessage = null

  constructor(userIds, packet, notSaveInOfflineStorage, ws) {
    this.userIds = userIds
    this.packet = packet
    this.notSaveInOfflineStorage = !!notSaveInOfflineStorage
    this.ws = ws
  }

  setOrgId(orgId) {
    this.orgId = orgId

    return this
  }

  setConversationDestination(cid, exceptUserIds = []) {
    this.cId = cid
    this.exceptUserIds = exceptUserIds ?? this.exceptUserIds

    return this
  }

  addPushQueueMessage(pushQueueMessage) {
    this.pushQueueMessage = pushQueueMessage
    return this
  }
}

export default DeliverMessage
