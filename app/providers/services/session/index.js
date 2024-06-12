import { buildWsEndpoint } from '../../../utils/build_ws_endpoint.js'
import { splitWsEndpoint } from '../../../utils/split_ws_endpoint.js'
import { CONSTANTS } from '../../../constants/constants.js'

class SessionService {
  constructor(activeSessions, redisConnection, RuntimeDefinedContext) {
    this.activeSessions = activeSessions
    this.redisConnection = redisConnection
    this.RuntimeDefinedContext = RuntimeDefinedContext
  }
  
  totalSessions() {
    return this.activeSessions.SESSIONS.size
  }

  addUserDeviceConnection(ws, userId, deviceId) {
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

    this.setSessionUserId(ws, userId)

    return wsToClose
  }

  async addUserToList(userId, deviceId, nodeIp, nodePort) {
    await this.redisConnection.client.sAdd(
      `node:${buildWsEndpoint(nodeIp, nodePort)}`,
      JSON.stringify(userId + ':' + deviceId)
    )
  }

  async removeUserFromList(userId, deviceId, nodeIp, nodePort) {
    await this.redisConnection.client.sRem(
      `node:${buildWsEndpoint(nodeIp, nodePort)}`,
      JSON.stringify(userId + ':' + deviceId)
    )
  }

  async clearNodeUsersSession(nodeUrl) {
    const users = await this.redisConnection.client.sMembers(`node:${nodeUrl}`)
    if (!users.length) {
      return
    }

    const [nodeIp, nodePort] = splitWsEndpoint(nodeUrl)
    users.forEach((u) => {
      const [userId, deviceId] = u.split(':')
      this.removeUserNodeData(userId, deviceId, nodeIp, nodePort)
    })

    await this.redisConnection.client.del(`node:${nodeUrl}`)
  }

  async storeUserNodeData(userId, deviceId, nodeIp, nodePort) {
    const userConnectsString = await this.getUserNodeData(userId)

    let isRecordFromThisDevice = false
    let record = null
    userConnectsString.forEach((d) => {
      const data = JSON.parse(d)
      if (Object.keys(data)[0] === '' + deviceId) {
        record = d

        isRecordFromThisDevice = true
        return
      }
    })

    isRecordFromThisDevice && (await this.removeMember(userId, record))

    await this.redisConnection.client.sAdd(
      `user:${userId}`,
      JSON.stringify({
        [deviceId]: buildWsEndpoint(nodeIp, nodePort)
      })
    )

    await this.addUserToList(userId, deviceId, nodeIp, nodePort)
  }

  async removeUserNodeData(userId, deviceId, nodeIp, nodePort) {
    await this.redisConnection.client.sRem(
      `user:${userId}`,
      JSON.stringify({
        [deviceId]: buildWsEndpoint(nodeIp, nodePort),
      })
    )

    await this.removeUserFromList(userId, deviceId, nodeIp, nodePort)
  }

  async clearUserNodeData(userId) {
    await this.redisConnection.client.del(`user:${userId}`)
  }

  async getUserNodeData(userId) {
    return await this.redisConnection.client.sMembers(`user:${userId}`)
  }

  async removeMember(userId, member) {
    return await this.redisConnection.client.sRem(`user:${userId}`, member)
  }

  setSessionUserId(ws, userId) {
    const session = this.getSession(ws)

    if (!session) {
      this.setSession(ws, userId)
      return
    }

    session.userId = userId

    return session
  }

  setSession(ws, userId, extraParams = {}) {
    this.activeSessions.SESSIONS.set(ws, { userId, extraParams })
  }

  getSessionUserId(ws) {
    const session = this.getSession(ws)
    return session ? session.userId : null
  }

  getSession(ws) {
    return this.activeSessions.SESSIONS.has(ws) ? this.activeSessions.SESSIONS.get(ws) : null
  }

  setSessionInactiveState(ws, isInactive) {
    const session = this.getSession(ws)

    session.extraParams[CONSTANTS.SESSION_INACTIVE_STATE_KEY] = isInactive

    return session
  }

  isSessionInactive(ws) {
    const session = this.getSession(ws)

    return session.extraParams[CONSTANTS.SESSION_INACTIVE_STATE_KEY]
  }

  getDeviceId(ws, userId) {
    if (this.activeSessions.DEVICES[userId]) {
      return this.activeSessions.DEVICES[userId].find((el) => el.ws === ws)
        ?.deviceId
    }

    return null
  }

  getUserDevices(userId) {
    return this.activeSessions.DEVICES[userId] ?? []
  }

  async removeAllUserSessions(ws) {
    const userId = this.getSessionUserId(ws)
    delete this.activeSessions.DEVICES[userId]
    await this.clearUserNodeData(userId)
    this.activeSessions.SESSIONS.delete(ws)
  }

  async removeUserSession(ws, userId, deviceId) {
    userId = userId ?? this.getSessionUserId(ws)
    deviceId = deviceId ?? this.getDeviceId(ws, userId)

    const leftActiveConnections = this.getUserDevices(userId).filter(({ deviceId: activeDeviceId }) => activeDeviceId !== deviceId)

    if (!leftActiveConnections.length) {
      this.removeAllUserSessions(ws)
      return
    }

    await this.removeUserNodeData(
      userId,
      deviceId,
      this.RuntimeDefinedContext.APP_IP,
      this.RuntimeDefinedContext.CLUSTER_PORT
    )

    this.activeSessions.DEVICES[userId] = leftActiveConnections
    this.activeSessions.SESSIONS.delete(ws)
  }
}

export default SessionService
