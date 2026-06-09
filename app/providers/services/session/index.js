import { CONSTANTS } from "../../../constants/constants.js"

/*
  Structs:
  SET - sama-node-users:{node-endpoint} -> {organizationId}:{userId}:{deviceId}
  SET - sama-user-devices:{organizationId}:{userId} -> {deviceId}
  HASH - sama-user-data:{userId}:{deviceId} -> extra params
*/

class SessionService {
  constructor(activeSessions, config, logger, redisConnection) {
    this.activeSessions = activeSessions
    this.config = config
    this.logger = logger
    this.redisConnection = redisConnection
  }

  totalSessions() {
    return this.activeSessions.SESSIONS.size
  }

  addUserDeviceConnection(socket, organizationId, userId, deviceId) {
    const activeConnections = this.getUserDevices(userId)

    const sameSocketConnection = activeConnections.find(connection => connection.socket === socket)
    const sameDeviceConnection = activeConnections.find(connection => connection.deviceId === deviceId)

    const otherDeviceConnections = activeConnections.filter(connection => 
      (connection !== sameSocketConnection) &&
      (connection !== sameDeviceConnection)
    )

    const connection = { socket: socket, deviceId, organizationId }

    this.activeSessions.DEVICES[userId] = [...otherDeviceConnections, connection]

    this.setSessionUserId(socket, organizationId, userId, { [CONSTANTS.SESSION_DEVICE_ID_KEY]: deviceId })

    return { sameDeviceConnection, sameSocketConnection }
  }

  #nodesSetCacheKey(nodeEndpoint) {
    return `${CONSTANTS.REDIS_PREFIXES.NODE_USERS}:${nodeEndpoint}`
  }

  async addUserDeviceToNode(nodeEndpoint, organizationId, userId, deviceId) {
    const nodeKey = this.#nodesSetCacheKey(nodeEndpoint)
    const userConnectionMember = `${organizationId}:${userId}:${deviceId}`

    await this.redisConnection.client.sAdd(nodeKey, userConnectionMember)
  }

  async removeUserDeviceFromNode(nodeEndpoint, organizationId, userId, deviceId) {
    const nodeKey = this.#nodesSetCacheKey(nodeEndpoint)
    const userConnectionMember = `${organizationId}:${userId}:${deviceId}`

    await this.redisConnection.client.sRem(nodeKey, userConnectionMember)
  }

  async listNodeUserDevices(nodeEndpoint) {
    const nodeKey = this.#nodesSetCacheKey(nodeEndpoint)
    const usersConnections = await this.redisConnection.client.sMembers(nodeKey)

    const users = usersConnections.map((userConnection) => {
      const [organizationId, userId, deviceId] = userConnection.split(":")

      return { organizationId, userId, deviceId }
    })

    return users
  }

  async deleteNodeConnections(nodeEndpoint) {
    const nodeKey = this.#nodesSetCacheKey(nodeEndpoint)
    await this.redisConnection.client.del(nodeKey)
  }

  #usersSetCacheKey(organizationId, userId) {
    return `${CONSTANTS.REDIS_PREFIXES.USER_DEVICES}:${organizationId}:${userId}`
  }

  #usersHashCacheKey(userId, deviceId) {
    return `${CONSTANTS.REDIS_PREFIXES.USER_DATA}:${userId}:${deviceId}`
  }

  async addUserDevice(organizationId, userId, deviceId) {
    const userKey = this.#usersSetCacheKey(organizationId, userId)
    await this.redisConnection.client.sAdd(userKey, deviceId)
  }

  async removeUserDevice(organizationId, userId, deviceId, returnIsLast) {
    const userKey = this.#usersSetCacheKey(organizationId, userId)

    await this.redisConnection.client.sRem(userKey, deviceId)

    if (!returnIsLast) {
      return
    }

    const leftUserDevices = await this.listUserDevice(organizationId, userId)

    return !leftUserDevices?.length
  }

  async listUserDevice(organizationId, userId, filterActualDevices) {
    if (this.config.get("app.isStandAloneNode")) {
      return this.listUserDeviceLocal(userId)
    }

    const userKey = this.#usersSetCacheKey(organizationId, userId)

    let deviceIds = await this.redisConnection.client.sMembers(userKey)
    deviceIds = deviceIds ?? []

    if (filterActualDevices) {
      deviceIds = await this.filterActualDeviceIds(organizationId, userId, deviceIds)
    }

    return deviceIds
  }

  async filterActualDeviceIds(organizationId, userId, deviceIds) {
    const actualDevices = new Set(deviceIds)

    for (const deviceId of deviceIds) {
      const deviceExt = await this.retrieveUserExtraParams(userId, deviceId)

      const noEndpointKey = !deviceExt[CONSTANTS.SESSION_NODE_KEY]
      const isSameEndpoint = (deviceExt[CONSTANTS.SESSION_NODE_KEY] === this.config.get("ws.cluster.endpoint"))
      const hasDeviceConnection = this.getUserDevices(userId).find(connection => connection.deviceId === deviceId)
      const isHasExtButNoConnection = isSameEndpoint && !hasDeviceConnection

      if (noEndpointKey || isHasExtButNoConnection) {
        actualDevices.delete(deviceId)
        await this.removeAllUserDeviceDataTransaction(this.config.get("ws.cluster.endpoint"), organizationId, userId, deviceId)
        this.logger.debug("[listUserDevice][not actual deviceId]: %o %o", { organizationId, userId, deviceId }, { noEndpointKey, isSameEndpoint, hasDeviceConnection })
      }
    }

    return Array.from(actualDevices)
  }

  listUserDeviceLocal(userId) {
    return this.getUserDevices(userId)
      .map((connection) => connection?.deviceId)
      .filter((deviceId) => deviceId !== CONSTANTS.HTTP_DEVICE_ID)
  }

  async deleteUserDevices(organizationId, userId) {
    const userKey = this.#usersSetCacheKey(organizationId, userId)

    await this.redisConnection.client.del(userKey)
  }

  async addUserExtraParams(userId, deviceId, extraParams) {
    const userHashKey = this.#usersHashCacheKey(userId, deviceId)
    const keyValuePairs = Object.entries(extraParams)
      .flat()
      .map((val) => `${val}`)

    await this.redisConnection.client.hSet(userHashKey, keyValuePairs)
  }

  async retrieveUserExtraParams(userId, deviceId) {
    const userHashKey = this.#usersHashCacheKey(userId, deviceId)
    const extraParams = await this.redisConnection.client.hGetAll(userHashKey)
    return extraParams
  }

  async removeUserExtraParams(userId, deviceId, paramKeys) {
    const userHashKey = this.#usersHashCacheKey(userId, deviceId)
    await this.redisConnection.client.hDel(userHashKey, ...paramKeys)
  }

  async deleteUserExtraParams(userId, deviceId) {
    const userHashKey = this.#usersHashCacheKey(userId, deviceId)
    await this.redisConnection.client.del(userHashKey)
  }

  async removeUserData(organizationId, userId, deviceId) {
    const isWasLastUserSession = await this.removeUserDevice(organizationId, userId, deviceId, true)

    await this.deleteUserExtraParams(userId, deviceId)

    return isWasLastUserSession
  }

  async deleteUserData(organizationId, userId) {
    const userDevices = await this.listUserDevice(organizationId, userId)

    for (const deviceId of userDevices) {
      await this.deleteUserExtraParams(userId, deviceId)
    }

    await this.deleteUserDevices(organizationId, userId)
  }

  async removeAllUserDeviceDataTransaction(nodeEndpoint, organizationId, userId, deviceId) {
    const userKey = this.#usersSetCacheKey(organizationId, userId)
    const userHashKey = this.#usersHashCacheKey(userId, deviceId)
    const nodeKey = this.#nodesSetCacheKey(nodeEndpoint ?? this.config.get("ws.cluster.endpoint"))
    const userConnectionMember = `${organizationId}:${userId}:${deviceId}`

    const tx = this.redisConnection.client.multi()

    tx.sRem(userKey, deviceId)
    tx.del(userHashKey)
    tx.sRem(nodeKey, userConnectionMember)

    const multiResult = await tx.exec()

    this.logger.debug("[removeAllUserDeviceDataTransaction][result]: %o %o", { organizationId, userId, deviceId }, multiResult)

    return multiResult
  }

  async removeAllUserDeviceData(organizationId, userId, deviceId) {
    await this.removeUserDevice(organizationId, userId, deviceId)
    const extraParams = await this.retrieveUserExtraParams(userId, deviceId)
    await this.deleteUserExtraParams(userId, deviceId)

    const nodeEndpoint = extraParams?.[CONSTANTS.SESSION_NODE_KEY] ?? this.config.get("ws.cluster.endpoint")

    await this.removeUserDeviceFromNode(nodeEndpoint, organizationId, userId, deviceId)

    const leftDevices = await this.listUserDevice(organizationId, userId, true)

    return !leftDevices?.length
  }

  async listUserData(organizationId, userId) {
    const userData = {}

    if (this.config.get("app.isStandAloneNode")) {
      for (const connection of this.getUserDevices(userId)) {
        if (!connection?.socket || connection?.deviceId === CONSTANTS.HTTP_DEVICE_ID) continue
        const session = this.getSession(connection.socket)
        if (session?.extraParams) {
          userData[connection.deviceId] = session.extraParams
        }
      }

      return userData
    }

    const userDevices = await this.listUserDevice(organizationId, userId)

    for (const deviceId of userDevices) {
      const extraParams = await this.retrieveUserExtraParams(userId, deviceId)
      userData[deviceId] = extraParams
    }

    return userData
  }

  async addUserDeviceDataTransaction(nodeEndpoint, organizationId, userId, deviceId, extParams) {
    const userKey = this.#usersSetCacheKey(organizationId, userId)
    const userHashKey = this.#usersHashCacheKey(userId, deviceId)
    const keyValuePairs = Object.entries(extParams).flat().map((val) => `${val}`)
    const nodeKey = this.#nodesSetCacheKey(nodeEndpoint ?? this.config.get("ws.cluster.endpoint"))
    const userConnectionMember = `${organizationId}:${userId}:${deviceId}`

    const tx = this.redisConnection.client.multi()

    tx.sAdd(userKey, deviceId)
    tx.hSet(userHashKey, keyValuePairs)
    tx.sAdd(nodeKey, userConnectionMember)

    const multiResult = await tx.exec()

    this.logger.debug("[addUserDeviceDataTransaction][result]: %o %o", { organizationId, userId, deviceId }, multiResult)

    return multiResult
  }

  async storeUserNodeData(socket, organizationId, userId, deviceId) {
    const nodeEndpoint = this.config.get("ws.cluster.endpoint")

    const session = this.getSession(socket)
    if (session?.extraParams) {
      session.extraParams[CONSTANTS.SESSION_NODE_KEY] = nodeEndpoint
    }

    if (this.config.get("app.isStandAloneNode")) return

    const userDeviceIds = await this.listUserDevice(organizationId, userId)

    if (userDeviceIds.includes(deviceId)) {
      await this.removeAllUserDeviceData(organizationId, userId, deviceId)
    }

    await this.addUserDeviceDataTransaction(nodeEndpoint, organizationId, userId, deviceId, { [CONSTANTS.SESSION_NODE_KEY]: nodeEndpoint })
  }

  async clearNodeUsersSession(nodeEndpoint) {
    if (this.config.get("app.isStandAloneNode")) return

    const lastUserSessions = []

    const userConnections = await this.listNodeUserDevices(nodeEndpoint)

    for (const userData of userConnections) {
      const isLastUserSession = await this.removeUserData(userData.organizationId, userData.userId, userData.deviceId)
      if (isLastUserSession) lastUserSessions.push(userData)
    }

    await this.deleteNodeConnections(nodeEndpoint)

    return lastUserSessions
  }

  setSessionUserId(socket, organizationId, userId, extraParams) {
    const session = this.getSession(socket)

    if (session) {
      this.activeSessions.SESSIONS.delete(socket)
    }

    this.setSession(socket, organizationId, userId, extraParams)
  }

  setSession(socket, organizationId, userId, extraParams = {}) {
    this.activeSessions.SESSIONS.set(socket, { organizationId, userId, extraParams })
  }

  getSessionUserId(socket) {
    const session = this.getSession(socket)
    return session ? session.userId : null
  }

  getSession(socket) {
    return this.activeSessions.SESSIONS.has(socket) ? this.activeSessions.SESSIONS.get(socket) : null
  }

  async setSessionInactiveState(socket, isInactive) {
    const { userId, extraParams } = this.getSession(socket)
    const deviceId = this.getDeviceId(socket, userId)

    if (isInactive) {
      extraParams[CONSTANTS.SESSION_INACTIVE_STATE_KEY] = isInactive
      if (!this.config.get("app.isStandAloneNode")) {
        await this.addUserExtraParams(userId, deviceId, { [CONSTANTS.SESSION_INACTIVE_STATE_KEY]: isInactive })
      }
    } else {
      delete extraParams[CONSTANTS.SESSION_INACTIVE_STATE_KEY]
      if (!this.config.get("app.isStandAloneNode")) {
        await this.removeUserExtraParams(userId, deviceId, [CONSTANTS.SESSION_INACTIVE_STATE_KEY])
      }
    }

    return isInactive
  }

  isUserInactive(socket, extraParams) {
    const session = this.getSession(socket)

    if (session) {
      return session.extraParams[CONSTANTS.SESSION_INACTIVE_STATE_KEY]
    }

    return extraParams[CONSTANTS.SESSION_INACTIVE_STATE_KEY]
  }

  getDeviceId(socket, userId) {
    if (this.activeSessions.DEVICES[userId]) {
      return this.activeSessions.DEVICES[userId].find((connection) => connection.socket === socket)?.deviceId
    }

    return null
  }

  getUserDevices(userId) {
    return this.activeSessions.DEVICES[userId] ?? []
  }

  async removeAllUserSessions(socket) {
    const session = this.getSession(socket)
    if (!session) {
      return
    }

    const { userId, organizationId } = session

    delete this.activeSessions.DEVICES[userId]
    this.activeSessions.SESSIONS.delete(socket)

    if (this.config.get("app.isStandAloneNode")) return

    const userData = await this.listUserData(organizationId, userId)

    for (const [deviceId, extraParams] of Object.entries(userData)) {
      if (!extraParams[CONSTANTS.SESSION_NODE_KEY]) {
        continue
      }

      const nodeEndpoint = extraParams[CONSTANTS.SESSION_NODE_KEY]
      await this.removeUserDeviceFromNode(nodeEndpoint, organizationId, userId, deviceId)
    }

    await this.deleteUserData(organizationId, userId)
  }

  async removeUserSession(socket, userId, deviceId) {
    userId = userId ?? this.getSessionUserId(socket)
    deviceId = deviceId ?? this.getDeviceId(socket, userId)
    const organizationId = this.getSession(socket)?.organizationId

    this.logger.debug("[removeUserSession][vars] %o", { organizationId, userId, deviceId })

    const leftActiveConnections = this.getUserDevices(userId).filter(({ deviceId: activeDeviceId }) => activeDeviceId !== deviceId)
    let isLastConnection = !leftActiveConnections?.length

    if (leftActiveConnections?.length) {
      this.activeSessions.DEVICES[userId] = leftActiveConnections
    } else {
      delete this.activeSessions.DEVICES[userId]
    }

    this.activeSessions.SESSIONS.delete(socket)

    if (!deviceId) {
      return isLastConnection
    }

    if (this.config.get("app.isStandAloneNode")) return isLastConnection

    this.logger.debug("[removeUserSession][left connections] %o", leftActiveConnections?.map(con => con.deviceId))

    isLastConnection = await this.removeAllUserDeviceData(organizationId, userId, deviceId)

    this.logger.debug("[removeUserSession][end] %o %s", { organizationId, userId, deviceId }, isLastConnection)

    return isLastConnection
  }

  async onlineUsersList(organizationId, offset = 0, limit = 10) {
    return this.config.get("app.isStandAloneNode")
      ? this.onlineUsersListLocal(organizationId, offset, limit)
      : await this.onlineUsersListWithNode(organizationId, offset, limit)
  }

  async onlineUsersCount(organizationId) {
    return this.config.get("app.isStandAloneNode")
      ? this.onlineUsersCountLocal(organizationId)
      : await this.onlineUsersCountWithNodes(organizationId)
  }

  async onlineUsersListWithNode(organizationId, offset, limit) {
    const matchPattern = this.#usersSetCacheKey(organizationId, "*")

    const userKeys = await this.redisConnection.scanWithPagination("set", matchPattern, offset, limit)

    const userIds = userKeys.map((userKey) => userKey.split(":").at(-1))
    const actualUserIds = new Set(userIds)

    for (const userId of userIds) {
      const actualDevices = await this.listUserDevice(organizationId, userId, true)
      if (!actualDevices?.length) {
        actualUserIds.delete(userId)
      }
    }

    return Array.from(actualUserIds)
  }

  async onlineUsersCountWithNodes(organizationId) {
    const matchPattern = this.#usersSetCacheKey(organizationId, "*")

    const count = await this.redisConnection.countWithMatch("set", matchPattern)

    return count
  }

  onlineUsersListLocal(organizationId, offset, limit) {
    const userIds = this.retrieveLocalActiveSessionUserIds(organizationId)

    return userIds.slice(offset, offset + limit)
  }

  onlineUsersCountLocal(organizationId) {
    const userIds = this.retrieveLocalActiveSessionUserIds(organizationId)

    return userIds.length
  }

  retrieveLocalActiveSessionUserIds(organizationId) {
    const userIds = Array.from(this.activeSessions.SESSIONS.values())
      .filter(
        (session) =>
          session?.organizationId?.toString() === organizationId?.toString() &&
          session?.extraParams[CONSTANTS.SESSION_DEVICE_ID_KEY] !== CONSTANTS.HTTP_DEVICE_ID &&
          session?.userId && this.listUserDeviceLocal(session?.userId)?.length
      )
      .map((session) => session.userId)
      .sort((userIdA, userIdB) => userIdA - userIdB)

    return Array.from(new Set(userIds))
  }
}

export default SessionService
