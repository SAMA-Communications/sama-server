import BaseRepository from './base.js'

import RedisClient from '../lib/redis.js'

import { ACTIVE } from '../store/session.js'

import { buildWsEndpoint } from '../utils/build_ws_endpoint.js'
import { splitWsEndpoint } from '../utils/split_ws_endpoint.js'

class SessionRepository extends BaseRepository {
  constructor(activeSessions) {
    super(null)
    this.activeSessions = activeSessions
  }

  get sessionsTotal() {
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
    await RedisClient.client.sAdd(
      `node:${buildWsEndpoint(nodeIp, nodePort)}`,
      JSON.stringify(userId + ':' + deviceId)
    )
  }

  async removeUserFromList(userId, deviceId, nodeIp, nodePort) {
    await RedisClient.client.sRem(
      `node:${buildWsEndpoint(nodeIp, nodePort)}`,
      JSON.stringify(userId + ':' + deviceId)
    )
  }

  async clearNodeUsersSession(nodeUrl) {
    const users = await RedisClient.client.sMembers(`node:${nodeUrl}`)
    if (!users.length) {
      return
    }

    const [nodeIp, nodePort] = splitWsEndpoint(nodeUrl)
    users.forEach((u) => {
      const [userId, deviceId] = u.split(':')
      this.removeUserNodeData(userId, deviceId, nodeIp, nodePort)
    })

    await RedisClient.client.del(`node:${nodeUrl}`)
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

    await RedisClient.client.sAdd(
      `user:${userId}`,
      JSON.stringify({
        [deviceId]: buildWsEndpoint(nodeIp, nodePort),
      })
    )

    await this.addUserToList(userId, deviceId, nodeIp, nodePort)
  }

  async removeUserNodeData(userId, deviceId, nodeIp, nodePort) {
    await RedisClient.client.sRem(
      `user:${userId}`,
      JSON.stringify({
        [deviceId]: buildWsEndpoint(nodeIp, nodePort),
      })
    )

    await this.removeUserFromList(userId, deviceId, nodeIp, nodePort)
  }

  async clearUserNodeData(userId) {
    await RedisClient.client.del(`user:${userId}`)
  }

  async getUserNodeData(userId) {
    return await RedisClient.client.sMembers(`user:${userId}`)
  }

  async dropUserNodeDataBase() {
    await RedisClient.client.flushDb()
  }

  async removeMember(userId, member) {
    return await RedisClient.client.sRem(`user:${userId}`, member)
  }

  setSessionUserId(ws, userId) {
    this.activeSessions.SESSIONS.set(ws, { user_id: userId })
  }

  getSessionUserId(ws) {
    if (this.activeSessions.SESSIONS.get(ws)) {
      return this.activeSessions.SESSIONS.get(ws).user_id.toString()
    }
    return null
  }

  getDeviceId(ws, userId) {
    if (this.activeSessions.DEVICES[userId]) {
      return this.activeSessions.DEVICES[userId].find((el) => el.ws === ws)
        ?.deviceId
    }
    return null
  }
}

export default new SessionRepository(ACTIVE)
