import type { Socket } from "node:net"
import type { WebSocket } from "uWebSockets.js"
import type { RecognizedString } from "uWebSockets.js"

import logger from "../logger/index.js"

export async function tcpSafeSend(socket: Socket, data: string | Buffer): Promise<void> {
  try {
    await new Promise<void>((resolve, reject) => {
      socket.write(data, (error) => (error ? reject(error) : resolve()))
    })
  } catch (error) {
    logger.error(error, "[tcp write]")
  }
}

export function wsSafeSend(ws: WebSocket<unknown>, data: RecognizedString): void {
  try {
    ws.send(data)
  } catch (error) {
    logger.error(error, "[ws send]")
  }
}
