import { buildWsEndpoint } from "../../../utils/build_ws_endpoint.js"
import { splitWsEndpoint } from "../../../utils/split_ws_endpoint.js"
import { CONSTANTS } from "../../../constants/constants.js"

/*
  Structs:
  SET - node:{node-endpoint} -> {userId}:{deviceId}
  SET - user:{organizationId}:{userId} -> {deviceId}
  HASH - user:{userId}:{deviceId} -> extra params
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
    const activeConnections = this.activeSessions.DEVICES[userId]
    const wsToClose = []

    const connection = { ws: socket, deviceId, organizationId }

    if (activeConnections) {
      const devices = activeConnections.filter((connection) => {
        if (connection.deviceId !== deviceId) {
          return true
        } else {
          wsToClose.push(connection.ws)
          return false
        }
      })
      this.activeSessions.DEVICES[userId] = [...devices, connection]
    } else {
      this.activeSessions.DEVICES[userId] = [connection]
    }

    this.setSessionUserId(socket, organizationId, userId, { [CONSTANTS.SESSION_DEVICE_ID_KEY]: deviceId })

    return wsToClose
  }

  #nodesSetCacheKey(nodeIp, nodePort, nodeEndpoint) {
    return `node:${nodeEndpoint ? nodeEndpoint : buildWsEndpoint(nodeIp, nodePort)}`
  }

  async addUserDeviceToNode(nodeIp, nodePort, userId, deviceId) {
    const nodeKey = this.#nodesSetCacheKey(nodeIp, nodePort)
    const userConnectionMember = `${userId}:${deviceId}`

    await this.redisConnection.client.sAdd(nodeKey, userConnectionMember)
  }

  async removeUserDeviceFromNode(nodeIp, nodePort, userId, deviceId) {
    const nodeKey = this.#nodesSetCacheKey(nodeIp, nodePort)
    const userConnectionMember = `${userId}:${deviceId}`

    await this.redisConnection.client.sRem(nodeKey, userConnectionMember)
  }

  async listNodeUserDevices(nodeIp, nodePort, nodeEndpoint) {
    const nodeKey = this.#nodesSetCacheKey(nodeIp, nodePort, nodeEndpoint)
    const usersConnections = await this.redisConnection.client.sMembers(nodeKey)

    const users = usersConnections.map((userConnection) => {
      const [userId, deviceId] = userConnection.split(":")

      return { userId, deviceId }
    })

    return users
  }

  async deleteNodeConnections(nodeIp, nodePort, nodeEndpoint) {
    const nodeKey = this.#nodesSetCacheKey(nodeIp, nodePort, nodeEndpoint)
    await this.redisConnection.client.del(nodeKey)
  }

  #usersSetCacheKey(organizationId, userId) {
    return `user:${organizationId}:${userId}`
  }

  #usersHashCacheKey(userId, deviceId) {
    return `user:${userId}:${deviceId}`
  }

  async addUserDevice(organizationId, userId, deviceId) {
    const userKey = this.#usersSetCacheKey(organizationId, userId)
    await this.redisConnection.client.sAdd(userKey, deviceId)
  }

  async removeUserDevice(organizationId, userId, deviceId) {
    const userKey = this.#usersSetCacheKey(organizationId, userId)

    await this.redisConnection.client.sRem(userKey, deviceId)
  }

  async listUserDevice(organizationId, userId) {
    if (this.config.get("app.isStandAloneNode")) {
      return this.getUserDevices(userId)
        .map(connection => connection?.deviceId)
        .filter(deviceId => deviceId !== CONSTANTS.HTTP_DEVICE_ID)
    }

    const userKey = this.#usersSetCacheKey(organizationId, userId)

    const deviceIds = await this.redisConnection.client.sMembers(userKey)
    return deviceIds ?? []
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

    await this.redisConnection.client.hSet(userHashKey, ...keyValuePairs)
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
    await this.removeUserDevice(organizationId, userId, deviceId)
    await this.deleteUserExtraParams(userId, deviceId)
  }

  async deleteUserData(organizationId, userId) {
    const userDevices = await this.listUserDevice(organizationId, userId)

    for (const deviceId of userDevices) {
      await this.deleteUserExtraParams(userId, deviceId)
    }

    await this.deleteUserDevices(organizationId, userId)
  }

  async listUserData(organizationId, userId) {
    const userData = {}

    if (this.config.get("app.isStandAloneNode")) {
      for (const connection of this.getUserDevices(userId)) {
        if (!connection?.ws || connection?.deviceId === CONSTANTS.HTTP_DEVICE_ID) continue
        const session = this.getSession(connection.ws) 
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

  async storeUserNodeData(socket, organizationId, userId, deviceId, nodeIp, nodePort) {
    nodeIp ??= this.config.get("app.ip")
    nodePort ??= this.config.get("ws.cluster.port")
    const nodeEndpoint = buildWsEndpoint(nodeIp, nodePort)

    const session = this.getSession(socket)
    session.extraParams[CONSTANTS.SESSION_NODE_KEY] = nodeEndpoint

    if (this.config.get("app.isStandAloneNode")) return

    const userDeviceIds = await this.listUserDevice(organizationId, userId)

    if (userDeviceIds.includes(deviceId)) {
      await this.removeUserData(organizationId, userId, deviceId)
      await this.removeUserDeviceFromNode(nodeIp, nodePort, userId, deviceId)
    }

    await this.addUserDevice(organizationId, userId, deviceId)
    await this.addUserExtraParams(userId, deviceId, { [CONSTANTS.SESSION_NODE_KEY]: nodeEndpoint })
    await this.addUserDeviceToNode(nodeIp, nodePort, userId, deviceId)
  }

  async clearNodeUsersSession(nodeUrl) {
    if (this.config.get("app.isStandAloneNode")) return

    const userConnections = await this.listNodeUserDevices(void 0, void 0, nodeUrl)

    for (const { userId, deviceId } of userConnections) {
      await this.removeUserData(null, userId, deviceId)
    }

    await this.deleteNodeConnections(void 0, void 0, nodeUrl)
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
      return this.activeSessions.DEVICES[userId].find((el) => el.ws === socket)?.deviceId
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

      const [, nodeId, nodePort] = splitWsEndpoint(extraParams[CONSTANTS.SESSION_NODE_KEY])
      await this.removeUserDeviceFromNode(nodeId, nodePort, userId, deviceId)
    }

    await this.deleteUserData(organizationId, userId)
  }

  async removeUserSession(socket, userId, deviceId) {
    userId = userId ?? this.getSessionUserId(socket)
    deviceId = deviceId ?? this.getDeviceId(socket, userId)
    const orgId = this.getSession(socket)?.organizationId

    const leftActiveConnections = this.getUserDevices(userId).filter(({ deviceId: activeDeviceId }) => activeDeviceId !== deviceId)

    this.activeSessions.DEVICES[userId] = leftActiveConnections
    this.activeSessions.SESSIONS.delete(socket)

    if (!deviceId) {
      return
    }

    if (this.config.get("app.isStandAloneNode")) return

    const extraParams = await this.retrieveUserExtraParams(userId, deviceId)

    await this.removeUserDevice(orgId, userId, deviceId)
    await this.deleteUserExtraParams(userId, deviceId)

    const nodeEndpoint = extraParams?.[CONSTANTS.SESSION_NODE_KEY]
    if (!nodeEndpoint) {
      return
    }

    const [, nodeId, nodePort] = splitWsEndpoint(nodeEndpoint)
    await this.removeUserDeviceFromNode(nodeId, nodePort, userId, deviceId)
  }


  async onlineUsersList(organizationId, offset = 0, limit = 10) {
    return this.config.get("app.isStandAloneNode") ? 
      this.onlineUsersListLocal(organizationId, offset, limit) 
      : await this.onlineUsersListWithNode(organizationId, offset, limit)
  }

  async onlineUsersCount(organizationId) {
    return this.config.get("app.isStandAloneNode") ? 
      this.onlineUsersCountLocal(organizationId) 
      : await this.onlineUsersCountWithNodes(organizationId)
  }

  async onlineUsersListWithNode(organizationId, offset, limit) {
    const matchPattern = `user:${organizationId}:*`

    const userKeys = await this.redisConnection.scanWithPagination("set", matchPattern, offset, limit)

    return userKeys.map((userKey) => userKey.split(":").at(-1))
  }

  async onlineUsersCountWithNodes(organizationId) {
    const matchPattern = `user:${organizationId}:*`

    const count = await this.redisConnection.countWithMatch("set", matchPattern)

    return count
  }

  onlineUsersListLocal(organizationId, offset, limit) {
    const userIds = this.retrieveLocalActiveSessionUserIds(organizationId)
    
    userIds.slice(offset, offset + limit)

    this.logger.debug("[list] %j", userIds)

    return userIds
  }

  onlineUsersCountLocal(organizationId) {
    const userIds = this.retrieveLocalActiveSessionUserIds(organizationId)

    this.logger.debug("[count] %j", userIds)

    return userIds.length
  }

  retrieveLocalActiveSessionUserIds(organizationId) {
    const userIds = Array.from(this.activeSessions.SESSIONS.values())
      .filter(session => (
        (session?.organizationId === organizationId) &&
        (session?.extraParams[CONSTANTS.SESSION_DEVICE_ID_KEY] !== CONSTANTS.HTTP_DEVICE_ID) &&
        session?.userId)
      )
      .map(session => session.userId)
      .sort((userIdA, userIdB) => userIdA - userIdB)
  
    return Array.from(new Set(userIds))
  }
}

export default SessionService
