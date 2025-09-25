class DeliverMessage {
  ws = null

  orgId = null

  userIds = []
  ignoreSelf = true

  cId = null
  exceptUserIds = []

  packet = null
  notSaveInOfflineStorage = false
  pushQueueMessage = null

  constructor(orgId, packet, notSaveInOfflineStorage, ws) {
    this.orgId = orgId
    this.packet = packet
    this.notSaveInOfflineStorage = !!notSaveInOfflineStorage
    this.ws = ws
  }

  setOrgId(orgId) {
    this.orgId = orgId

    return this
  }

  setIgnoreSelf(isIgnore) {
    this.ignoreSelf = !!isIgnore

    return this
  }

  setUsersDestination(userIds, exceptUserIds) {
    this.userIds = userIds
    this.exceptUserIds = exceptUserIds ?? this.exceptUserIds

    return this
  }

  setConversationDestination(cId, exceptUserIds) {
    this.cId = cId
    this.exceptUserIds = exceptUserIds ?? this.exceptUserIds

    return this
  }

  addPushQueueMessage(pushQueueMessage) {
    this.pushQueueMessage = pushQueueMessage

    return this
  }
}

export default DeliverMessage
