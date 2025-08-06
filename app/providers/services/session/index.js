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
  constructor(activeSessions, config, redisConnection) {
    this.activeSessions = activeSessions
    this.config = config
    this.redisConnection = redisConnection
  }

  totalSessions() {
    return this.activeSessions.SESSIONS.size
  }

  addUserDeviceConnection(ws, organizationId, userId, deviceId) {
    const activeConnections = this.activeSessions.DEVICES[userId]
    const wsToClose = []

    if (activeConnections) {
      const devices = activeConnections.filter((connection) => {
        if (connection.deviceId !== deviceId) {
          return true
        } else {
          wsToClose.push(connection.ws)
          return false
        }
      })
      this.activeSessions.DEVICES[userId] = [...devices, { ws, deviceId }]
    } else {
      this.activeSessions.DEVICES[userId] = [{ ws, deviceId }]
    }

    this.setSessionUserId(ws, organizationId, userId)

    return wsToClose
  }

  #nodesSetKey(nodeIp, nodePort, nodeEndpoint) {
    return `node:${nodeEndpoint ? nodeEndpoint : buildWsEndpoint(nodeIp, nodePort)}`
  }

  async addUserDeviceToNode(nodeIp, nodePort, userId, deviceId) {
    const nodeKey = this.#nodesSetKey(nodeIp, nodePort)
    const userConnectionMember = `${userId}:${deviceId}`

    await this.redisConnection.client.sAdd(nodeKey, userConnectionMember)
  }

  async removeUserDeviceFromNode(nodeIp, nodePort, userId, deviceId) {
    const nodeKey = this.#nodesSetKey(nodeIp, nodePort)
    const userConnectionMember = `${userId}:${deviceId}`

    await this.redisConnection.client.sRem(nodeKey, userConnectionMember)
  }

  async listNodeUserDevices(nodeIp, nodePort, nodeEndpoint) {
    const nodeKey = this.#nodesSetKey(nodeIp, nodePort, nodeEndpoint)
    const usersConnections = await this.redisConnection.client.sMembers(nodeKey)

    const users = usersConnections.map((userConnection) => {
      const [userId, deviceId] = userConnection.split(":")

      return { userId, deviceId }
    })

    return users
  }

  async deleteNodeConnections(nodeIp, nodePort, nodeEndpoint) {
    const nodeKey = this.#nodesSetKey(nodeIp, nodePort, nodeEndpoint)
    await this.redisConnection.client.del(nodeKey)
  }

  #usersSetKey(organizationId, userId) {
    return `user:${organizationId}:${userId}`
  }

  #usersHashKey(userId, deviceId) {
    return `user:${userId}:${deviceId}`
  }

  async addUserDevice(organizationId, userId, deviceId) {
    const userKey = this.#usersSetKey(organizationId, userId)
    await this.redisConnection.client.sAdd(userKey, deviceId)
  }

  async removeUserDevice(organizationId, userId, deviceId) {
    const userKey = organizationId
      ? this.#usersSetKey(organizationId, userId)
      : await this.redisConnection.findKeyByPattern(`user:*:${userId}`)

    if (!userKey) {
      return
    }

    await this.redisConnection.client.sRem(userKey, deviceId)
  }

  async listUserDevice(organizationId, userId) {
    const userKey = organizationId
      ? this.#usersSetKey(organizationId, userId)
      : await this.redisConnection.findKeyByPattern(`user:*:${userId}`)

    if (!userKey) {
      return []
    }

    const deviceIds = await this.redisConnection.client.sMembers(userKey)
    return deviceIds
  }

  async deleteUserDevices(organizationId, userId) {
    const userKey = organizationId
      ? this.#usersSetKey(organizationId, userId)
      : await this.redisConnection.findKeyByPattern(`user:*:${userId}`)

    if (!userKey) {
      return
    }

    await this.redisConnection.client.del(userKey)
  }

  async addUserExtraParams(userId, deviceId, extraParams) {
    const userHashKey = this.#usersHashKey(userId, deviceId)
    const keyValuePairs = Object.entries(extraParams).flat().map(val => `${val}`)

    await this.redisConnection.client.hSet(userHashKey, ...keyValuePairs)
  }

  async retrieveUserExtraParams(userId, deviceId) {
    const userHashKey = this.#usersHashKey(userId, deviceId)
    const extraParams = await this.redisConnection.client.hGetAll(userHashKey)
    return extraParams
  }

  async removeUserExtraParams(userId, deviceId, paramKeys) {
    const userHashKey = this.#usersHashKey(userId, deviceId)
    await this.redisConnection.client.hDel(userHashKey, ...paramKeys)
  }

  async deleteUserExtraParams(userId, deviceId) {
    const userHashKey = this.#usersHashKey(userId, deviceId)
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

    const userDevices = await this.listUserDevice(organizationId, userId)

    for (const deviceId of userDevices) {
      const extraParams = await this.retrieveUserExtraParams(userId, deviceId)
      userData[deviceId] = extraParams
    }

    return userData
  }

  async storeUserNodeData(organizationId, userId, deviceId, nodeIp, nodePort) {
    nodeIp ??= this.config.get("app.ip")
    nodePort ??= this.config.get("ws.cluster.port")

    const userDeviceIds = await this.listUserDevice(organizationId, userId)

    if (userDeviceIds.includes(deviceId)) {
      await this.removeUserData(organizationId, userId, deviceId)
      await this.removeUserDeviceFromNode(nodeIp, nodePort, userId, deviceId)
    }

    await this.addUserDevice(organizationId, userId, deviceId)
    await this.addUserExtraParams(userId, deviceId, { [CONSTANTS.SESSION_NODE_KEY]: buildWsEndpoint(nodeIp, nodePort) })
    await this.addUserDeviceToNode(nodeIp, nodePort, userId, deviceId)
  }

  async clearNodeUsersSession(nodeUrl) {
    const userConnections = await this.listNodeUserDevices(void 0, void 0, nodeUrl)

    for (const { userId, deviceId } of userConnections) {
      await this.removeUserData(null, userId, deviceId)
    }

    await this.deleteNodeConnections(void 0, void 0, nodeUrl)
  }

  setSessionUserId(ws, organizationId, userId) {
    const session = this.getSession(ws)

    if (session) {
      this.activeSessions.SESSIONS.delete(ws)
    }

    this.setSession(ws, organizationId, userId)
  }

  setSession(ws, organizationId, userId, extraParams = {}) {
    this.activeSessions.SESSIONS.set(ws, { organizationId, userId, extraParams })
  }

  getSessionUserId(ws) {
    const session = this.getSession(ws)
    return session ? session.userId : null
  }

  getSession(ws) {
    return this.activeSessions.SESSIONS.has(ws) ? this.activeSessions.SESSIONS.get(ws) : null
  }

  async setSessionInactiveState(ws, isInactive) {
    const { userId, extraParams } = this.getSession(ws)
    const deviceId = this.getDeviceId(ws, userId)

    if (isInactive) {
      extraParams[CONSTANTS.SESSION_INACTIVE_STATE_KEY] = isInactive
      await this.addUserExtraParams(userId, deviceId, { [CONSTANTS.SESSION_INACTIVE_STATE_KEY]: isInactive })
    } else {
      delete extraParams[CONSTANTS.SESSION_INACTIVE_STATE_KEY]
      await this.removeUserExtraParams(userId, deviceId, [CONSTANTS.SESSION_INACTIVE_STATE_KEY])
    }

    return isInactive
  }

  isUserInactive(ws, extraParams) {
    const session = this.getSession(ws)

    if (session) {
      return session.extraParams[CONSTANTS.SESSION_INACTIVE_STATE_KEY]
    }

    return extraParams[CONSTANTS.SESSION_INACTIVE_STATE_KEY]
  }

  getDeviceId(ws, userId) {
    if (this.activeSessions.DEVICES[userId]) {
      return this.activeSessions.DEVICES[userId].find((el) => el.ws === ws)?.deviceId
    }

    return null
  }

  getUserDevices(userId) {
    return this.activeSessions.DEVICES[userId] ?? []
  }

  async removeAllUserSessions(ws) {
    const session = this.getSession(ws)
    if (!session) {
      return
    }

    const { userId, organizationId } = session

    delete this.activeSessions.DEVICES[userId]
    this.activeSessions.SESSIONS.delete(ws)

    const userData = await this.listUserData(organizationId, userId)

    for (const [deviceId, extraParams] of Object.entries(userData)) {
      const [, nodeId, nodePort] = splitWsEndpoint(extraParams[CONSTANTS.SESSION_NODE_KEY])
      await this.removeUserDeviceFromNode(nodeId, nodePort, userId, deviceId)
    }

    await this.deleteUserData(organizationId, userId)
  }

  async removeUserSession(ws, userId, deviceId) {
    userId = userId ?? this.getSessionUserId(ws)
    deviceId = deviceId ?? this.getDeviceId(ws, userId)
    const orgId = this.getSession(ws)?.organizationId

    const leftActiveConnections = this.getUserDevices(userId).filter(({ deviceId: activeDeviceId }) => activeDeviceId !== deviceId)

    if (!leftActiveConnections.length) {
      this.removeAllUserSessions(ws)
      return
    }

    this.activeSessions.DEVICES[userId] = leftActiveConnections
    this.activeSessions.SESSIONS.delete(ws)

    if (!deviceId) {
      return
    }

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

  async onlineUsersList(organizationId, offset, limit) {
    const matchPattern = `user:${organizationId}:*`

    const userKeys = await this.redisConnection.scanWithPagination("set", matchPattern, offset, limit)

    return userKeys.map((userKey) => userKey.split(":").at(-1))
  }

  async onlineUsersCount(organizationId) {
    const matchPattern = `user:${organizationId}:*`

    const count = await this.redisConnection.countWithMatch("set", matchPattern)

    return count
  }
}

export default SessionService
