import { CONSTANTS } from "../../../constants/constants.js"
import type { Config } from "../../../config/index.js"
import type { Logger } from "../../../logger/index.js"
import type { RedisManager } from "../../../lib/redis.js"
import type {
  ActiveSessions,
  SessionUserDeviceConnection,
  SocketSession,
  UserExtraParams, NodeUserDeviceData
} from "../../../store/session.js"
import type { OrganizationNativeId, SessionDeviceId, UserNativeId } from "../../../types/common.js"
import type { SamaSocket } from "../../../types/socket-types.js"

export default class SessionService {
  activeSessions: ActiveSessions
  config: Config
  logger: Logger
  redisConnection: RedisManager

  constructor(activeSessions: ActiveSessions, config: Config, logger: Logger, redisConnection: RedisManager) {
    this.activeSessions = activeSessions
    this.config = config
    this.logger = logger
    this.redisConnection = redisConnection
  }

  totalSessions(): number {
    return this.activeSessions.SESSIONS.size
  }

  async addUserDeviceConnection(
    socket: SamaSocket,
    organizationId: OrganizationNativeId,
    userId: UserNativeId,
    deviceId: SessionDeviceId,
  ): Promise<SessionUserDeviceConnection | undefined> {
    const activeConnections = this.getUserDevices(userId)

    const sameSocketConnection = activeConnections.find((connection) => connection.socket === socket)
    const sameDeviceConnection = activeConnections.find((connection) => connection.deviceId === deviceId)

    const otherDeviceConnections = activeConnections.filter(
      (connection) => connection !== sameSocketConnection && connection !== sameDeviceConnection,
    )

    const connection: SessionUserDeviceConnection = { socket, deviceId, organizationId, userId }

    this.activeSessions.DEVICES.set(userId, [...otherDeviceConnections, connection])

    this.setSessionUserId(socket, organizationId, userId, { [CONSTANTS.SESSION_DEVICE_ID_KEY]: deviceId })

    if (sameSocketConnection) {
      await this.removeAllUserDeviceData(organizationId, userId, sameSocketConnection.deviceId)
    }

    return sameDeviceConnection
  }

  #nodesSetCacheKey(nodeEndpoint: string): string {
    return `${CONSTANTS.REDIS_PREFIXES.NODE_USERS}:${nodeEndpoint}`
  }

  async addUserDeviceToNode(
    nodeEndpoint: string,
    organizationId: OrganizationNativeId,
    userId: UserNativeId,
    deviceId: SessionDeviceId,
  ): Promise<void> {
    const nodeKey = this.#nodesSetCacheKey(nodeEndpoint)
    const userConnectionMember = `${organizationId}:${userId}:${deviceId}`

    await this.redisConnection.client.sAdd(nodeKey, userConnectionMember)
  }

  async removeUserDeviceFromNode(
    nodeEndpoint: string,
    organizationId: OrganizationNativeId,
    userId: UserNativeId,
    deviceId: SessionDeviceId,
  ): Promise<void> {
    const nodeKey = this.#nodesSetCacheKey(nodeEndpoint)
    const userConnectionMember = `${organizationId}:${userId}:${deviceId}`

    await this.redisConnection.client.sRem(nodeKey, userConnectionMember)
  }

  async listNodeUserDevices(nodeEndpoint: string): Promise<NodeUserDeviceData[]> {
    const nodeKey = this.#nodesSetCacheKey(nodeEndpoint)
    const usersConnections = await this.redisConnection.client.sMembers(nodeKey)

    return usersConnections.map((userConnection) => {
      const [organizationId, userId, deviceId] = userConnection.split(":")

      return { organizationId, userId, deviceId }
    })
  }

  async deleteNodeConnections(nodeEndpoint: string): Promise<void> {
    const nodeKey = this.#nodesSetCacheKey(nodeEndpoint)
    await this.redisConnection.client.del(nodeKey)
  }

  #usersSetCacheKey(organizationId: OrganizationNativeId, userId: UserNativeId | "*"): string {
    return `${CONSTANTS.REDIS_PREFIXES.USER_DEVICES}:${organizationId}:${userId}`
  }

  #usersHashCacheKey(userId: UserNativeId, deviceId: SessionDeviceId): string {
    return `${CONSTANTS.REDIS_PREFIXES.USER_DATA}:${userId}:${deviceId}`
  }

  async addUserDevice(organizationId: OrganizationNativeId, userId: UserNativeId, deviceId: SessionDeviceId): Promise<void> {
    const userKey = this.#usersSetCacheKey(organizationId, userId)
    await this.redisConnection.client.sAdd(userKey, deviceId)
  }

  async removeUserDevice(
    organizationId: OrganizationNativeId,
    userId: UserNativeId,
    deviceId: SessionDeviceId,
  ): Promise<boolean | void> {
    const userKey = this.#usersSetCacheKey(organizationId, userId)

    await this.redisConnection.client.sRem(userKey, deviceId)

    const leftUserDevices = await this.listUserDevice(organizationId, userId)

    if (!leftUserDevices?.length) {
      await this.deleteUserDevices(organizationId, userId)

      return true
    }
  }

  async listUserDevice(organizationId: OrganizationNativeId, userId: UserNativeId): Promise<SessionDeviceId[]> {
    if (this.config.get("app.isStandAloneNode")) {
      return this.listUserDeviceLocal(userId)
    }

    const userKey = this.#usersSetCacheKey(organizationId, userId)

    const deviceIds = await this.redisConnection.client.sMembers(userKey)
    return deviceIds ?? []
  }

  listUserDeviceLocal(userId: UserNativeId): SessionDeviceId[] {
    return this.getUserDevices(userId)
      .map((connection) => connection?.deviceId)
      .filter((deviceId): deviceId is SessionDeviceId => deviceId !== CONSTANTS.HTTP_DEVICE_ID)
  }

  async deleteUserDevices(organizationId: OrganizationNativeId, userId: UserNativeId): Promise<void> {
    const userKey = this.#usersSetCacheKey(organizationId, userId)

    await this.redisConnection.client.del(userKey)
  }

  async addUserExtraParams(userId: UserNativeId, deviceId: SessionDeviceId, extraParams: UserExtraParams): Promise<void> {
    const userHashKey = this.#usersHashCacheKey(userId, deviceId)
    const keyValuePairs = Object.entries(extraParams)
      .flat()
      .map((val) => `${val}`)

    await this.redisConnection.client.hSet(userHashKey, keyValuePairs)
  }

  async retrieveUserExtraParams(userId: UserNativeId, deviceId: SessionDeviceId): Promise<UserExtraParams> {
    const userHashKey = this.#usersHashCacheKey(userId, deviceId)
    return await this.redisConnection.client.hGetAll(userHashKey)
  }

  async removeUserExtraParams(userId: UserNativeId, deviceId: SessionDeviceId, paramKeys: string[]): Promise<void> {
    if (!paramKeys.length) {
      return
    }

    const userHashKey = this.#usersHashCacheKey(userId, deviceId)
    await this.redisConnection.client.hDel(userHashKey, paramKeys)
  }

  async deleteUserExtraParams(userId: UserNativeId, deviceId: SessionDeviceId): Promise<void> {
    const userHashKey = this.#usersHashCacheKey(userId, deviceId)
    await this.redisConnection.client.del(userHashKey)
  }

  async removeUserData(
    organizationId: OrganizationNativeId,
    userId: UserNativeId,
    deviceId: SessionDeviceId,
  ): Promise<boolean | void> {
    const isWasLastUserSession = await this.removeUserDevice(organizationId, userId, deviceId)

    await this.deleteUserExtraParams(userId, deviceId)

    return isWasLastUserSession
  }

  async deleteUserData(organizationId: OrganizationNativeId, userId: UserNativeId): Promise<void> {
    const userDevices = await this.listUserDevice(organizationId, userId)

    for (const deviceId of userDevices) {
      await this.deleteUserExtraParams(userId, deviceId)
    }

    await this.deleteUserDevices(organizationId, userId)
  }

  async removeAllUserDeviceData(
    organizationId: OrganizationNativeId,
    userId: UserNativeId,
    deviceId: SessionDeviceId,
  ): Promise<boolean | void> {
    const isLastConnection = await this.removeUserDevice(organizationId, userId, deviceId)
    const extraParams = await this.retrieveUserExtraParams(userId, deviceId)
    await this.deleteUserExtraParams(userId, deviceId)

    const nodeEndpoint = extraParams?.[CONSTANTS.SESSION_NODE_KEY] ?? this.config.get<string>("ws.cluster.endpoint")

    await this.removeUserDeviceFromNode(nodeEndpoint, organizationId, userId, deviceId)

    return isLastConnection
  }

  async listUserData(organizationId: OrganizationNativeId, userId: UserNativeId): Promise<Record<SessionDeviceId, UserExtraParams>> {
    const userData: Record<SessionDeviceId, UserExtraParams> = {}

    if (this.config.get("app.isStandAloneNode")) {
      for (const connection of this.getUserDevices(userId)) {
        if (!connection?.socket || connection?.deviceId === CONSTANTS.HTTP_DEVICE_ID) continue
        const session = this.getSession(connection.socket)
        if (session?.extraParams) {
          userData[connection.deviceId] = session.extraParams as UserExtraParams
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

  async storeUserNodeData(
    socket: SamaSocket,
    organizationId: OrganizationNativeId,
    userId: UserNativeId,
    deviceId: SessionDeviceId,
  ): Promise<void> {
    const nodeEndpoint = this.config.get<string>("ws.cluster.endpoint")

    const session = this.getSession(socket)
    if (session?.extraParams) {
      session.extraParams[CONSTANTS.SESSION_NODE_KEY] = nodeEndpoint
    }

    if (this.config.get("app.isStandAloneNode")) return

    const userDeviceIds = await this.listUserDevice(organizationId, userId)

    if (userDeviceIds.includes(deviceId)) {
      await this.removeAllUserDeviceData(organizationId, userId, deviceId)
    }

    await this.addUserDevice(organizationId, userId, deviceId)
    await this.addUserExtraParams(userId, deviceId, { [CONSTANTS.SESSION_NODE_KEY]: nodeEndpoint })
    await this.addUserDeviceToNode(nodeEndpoint, organizationId, userId, deviceId)
  }

  async clearNodeUsersSession(nodeEndpoint: string): Promise<NodeUserDeviceData[]> {
    if (this.config.get("app.isStandAloneNode")) return []

    const lastUserSessions: NodeUserDeviceData[] = []

    const userConnections = await this.listNodeUserDevices(nodeEndpoint)

    for (const userData of userConnections) {
      const isLastUserSession = await this.removeUserData(userData.organizationId, userData.userId, userData.deviceId)
      if (isLastUserSession) lastUserSessions.push(userData)
    }

    await this.deleteNodeConnections(nodeEndpoint)

    return lastUserSessions
  }

  setSessionUserId(
    socket: SamaSocket,
    organizationId: OrganizationNativeId,
    userId: UserNativeId,
    extraParams: UserExtraParams,
  ): void {
    const session = this.getSession(socket)

    if (session) {
      this.activeSessions.SESSIONS.delete(socket)
    }

    this.setSession(socket, organizationId, userId, extraParams)
  }

  setSession(
    socket: SamaSocket,
    organizationId: OrganizationNativeId,
    userId: UserNativeId,
    extraParams: UserExtraParams = {},
  ): void {
    this.activeSessions.SESSIONS.set(socket, { organizationId, userId, extraParams })
  }

  getSessionUserId(socket: SamaSocket): UserNativeId | null {
    const session = this.getSession(socket)
    return session ? session.userId : null
  }

  getSession(socket: SamaSocket): SocketSession | null {
    return this.activeSessions.SESSIONS.has(socket) ? (this.activeSessions.SESSIONS.get(socket) ?? null) : null
  }

  async setSessionInactiveState(socket: SamaSocket, isInactive: boolean): Promise<boolean> {
    const session = this.getSession(socket)
    if (!session) {
      return isInactive
    }

    const { userId, extraParams } = session
    const deviceId = this.getDeviceId(socket, userId)

    if (!deviceId) {
      return isInactive
    }

    if (isInactive) {
      extraParams[CONSTANTS.SESSION_INACTIVE_STATE_KEY] = '1'
      if (!this.config.get("app.isStandAloneNode")) {
        await this.addUserExtraParams(userId, deviceId, { [CONSTANTS.SESSION_INACTIVE_STATE_KEY]: '1' })
      }
    } else {
      delete extraParams[CONSTANTS.SESSION_INACTIVE_STATE_KEY]
      if (!this.config.get("app.isStandAloneNode")) {
        await this.removeUserExtraParams(userId, deviceId, [CONSTANTS.SESSION_INACTIVE_STATE_KEY])
      }
    }

    return isInactive
  }

  isUserInactive(socket: SamaSocket, extraParams: UserExtraParams): unknown {
    const session = this.getSession(socket)

    if (session) {
      return session.extraParams[CONSTANTS.SESSION_INACTIVE_STATE_KEY]
    }

    return extraParams[CONSTANTS.SESSION_INACTIVE_STATE_KEY]
  }

  getDeviceId(socket: SamaSocket, userId: UserNativeId): SessionDeviceId | null {
    const devices = this.activeSessions.DEVICES.get(userId)
    if (devices) {
      return devices.find((connection) => connection.socket === socket)?.deviceId ?? null
    }

    return null
  }

  getUserDevices(userId: UserNativeId): SessionUserDeviceConnection[] {
    return this.activeSessions.DEVICES.get(userId) ?? []
  }

  async removeAllUserSessions(socket: SamaSocket): Promise<void> {
    const session = this.getSession(socket)
    if (!session) {
      return
    }

    const { userId, organizationId } = session

    this.activeSessions.DEVICES.delete(userId)
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

  async removeUserSession(socket: SamaSocket, userId?: UserNativeId | null, deviceId?: SessionDeviceId | null): Promise<boolean> {
    this.logger.debug("[removeUserSession][args]: %o", { socket: socket?.isAlive, userId, deviceId })

    const resolvedUserId = userId ?? this.getSessionUserId(socket)
    const resolvedDeviceId = deviceId ?? (resolvedUserId ? this.getDeviceId(socket, resolvedUserId) : null)
    const organizationId = this.getSession(socket)?.organizationId

    this.logger.debug(
      "[removeUserSession][vars]: %o [session]: %o [device]: %s",
      { organizationId, userId: resolvedUserId, deviceId: resolvedDeviceId },
      this.getSession(socket),
      resolvedUserId ? this.getDeviceId(socket, resolvedUserId) : null,
    )

    if (!resolvedUserId) {
      this.activeSessions.SESSIONS.delete(socket)
      return true
    }

    const devicesBefore = this.getUserDevices(resolvedUserId).map((connection) => {
      const { socket: connectionSocket, ...connectionData } = connection
      return { ...connectionData, socket: connectionSocket?.clientId }
    })

    this.logger.debug("[removeUserSession][devices][before]: %o %s", devicesBefore, devicesBefore?.length)

    const leftActiveConnections = this.getUserDevices(resolvedUserId).filter(
      ({ deviceId: activeDeviceId }) => activeDeviceId !== resolvedDeviceId,
    )
    let isLastConnection = !leftActiveConnections?.length

    if (leftActiveConnections?.length) {
      this.activeSessions.DEVICES.set(resolvedUserId, leftActiveConnections)
    } else {
      this.activeSessions.DEVICES.delete(resolvedUserId)
    }

    this.activeSessions.SESSIONS.delete(socket)

    const devicesAfter = this.getUserDevices(resolvedUserId).map((connection) => {
      const { socket: connectionSocket, ...connectionData } = connection
      return { ...connectionData, socket: connectionSocket?.clientId }
    })

    this.logger.debug("[removeUserSession][devices][after]: %o %s", devicesAfter, devicesAfter?.length)

    if (!resolvedDeviceId) {
      return isLastConnection
    }

    if (this.config.get("app.isStandAloneNode")) return isLastConnection

    if (organizationId) {
      isLastConnection = !!(await this.removeAllUserDeviceData(organizationId, resolvedUserId, resolvedDeviceId))
    }

    return isLastConnection
  }

  async onlineUsersList(organizationId: OrganizationNativeId, offset = 0, limit = 10): Promise<UserNativeId[]> {
    return this.config.get("app.isStandAloneNode")
      ? this.onlineUsersListLocal(organizationId, offset, limit)
      : await this.onlineUsersListWithNode(organizationId, offset, limit)
  }

  async onlineUsersCount(organizationId: OrganizationNativeId): Promise<number> {
    return this.config.get("app.isStandAloneNode")
      ? this.onlineUsersCountLocal(organizationId)
      : await this.onlineUsersCountWithNodes(organizationId)
  }

  async onlineUsersListWithNode(organizationId: OrganizationNativeId, offset: number, limit: number): Promise<UserNativeId[]> {
    const matchPattern = this.#usersSetCacheKey(organizationId, "*")

    const userKeys = await this.redisConnection.scanWithPagination("set", matchPattern, offset, limit)

    return userKeys.map((userKey) => userKey.split(":").at(-1) as UserNativeId)
  }

  async onlineUsersCountWithNodes(organizationId: OrganizationNativeId): Promise<number> {
    const matchPattern = this.#usersSetCacheKey(organizationId, "*")

    return await this.redisConnection.countWithMatch("set", matchPattern)
  }

  onlineUsersListLocal(organizationId: OrganizationNativeId, offset: number, limit: number): UserNativeId[] {
    const userIds = this.retrieveLocalActiveSessionUserIds(organizationId)

    userIds.slice(offset, offset + limit)

    return userIds
  }

  onlineUsersCountLocal(organizationId: OrganizationNativeId): number {
    const userIds = this.retrieveLocalActiveSessionUserIds(organizationId)

    return userIds.length
  }

  retrieveLocalActiveSessionUserIds(organizationId: OrganizationNativeId): UserNativeId[] {
    const userIds = Array.from(this.activeSessions.SESSIONS.values())
      .filter(
        (session) =>
          session?.organizationId === organizationId &&
          session?.extraParams[CONSTANTS.SESSION_DEVICE_ID_KEY] !== CONSTANTS.HTTP_DEVICE_ID &&
          session?.userId &&
          this.listUserDeviceLocal(session.userId)?.length,
      )
      .map((session) => session.userId)
      .sort((userIdA, userIdB) => Number(userIdA) - Number(userIdB))

    return Array.from(new Set(userIds))
  }
}
