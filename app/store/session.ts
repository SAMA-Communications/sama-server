import type { UserNativeId, OrganizationNativeId, SessionDeviceId } from "../types/common.js"
import type { SamaSocket } from "../types/socket-types.js"

export type UserExtraParams = Record<string, string>

export type SocketSession = {
  userId: UserNativeId,
  organizationId: OrganizationNativeId,
  extraParams: UserExtraParams
}

export type NodeUserDeviceData = {
  organizationId: OrganizationNativeId
  userId: UserNativeId
  deviceId: SessionDeviceId
}

export type SessionUserDeviceConnection = {
  socket: SamaSocket
} & NodeUserDeviceData

export type ActiveSessions = {
  SESSIONS: Map<SamaSocket, SocketSession>
  DEVICES: Map<UserNativeId, SessionUserDeviceConnection[]>
}

export const ACTIVE: ActiveSessions = {
  SESSIONS: new Map<SamaSocket, SocketSession>(),
  DEVICES: new Map<UserNativeId, SessionUserDeviceConnection[]>(),
}
