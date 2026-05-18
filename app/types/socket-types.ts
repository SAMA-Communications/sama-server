import type { Socket } from "node:net"
import type { WebSocket } from "uWebSockets.js"

export type SamaSocketExtensions = {
  apiType?: string
  clientId?: string
  isAlive?: boolean
}

export type SamaTcpSocket = Socket &
  SamaSocketExtensions & {
    safeSend?: (data: string | Buffer) => Promise<void>
  }

export type SamaWsSocket = WebSocket<unknown> &
  SamaSocketExtensions & {
    safeSend?: (data: string | Buffer) => void
  }

export type SamaSocket = SamaTcpSocket | SamaWsSocket
