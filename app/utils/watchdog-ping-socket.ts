import net from "node:net"

import { APIs, BASE_API } from "../networking/APIs.js"
import type { SamaTcpSocket, SamaWsSocket } from "../types/socket-types.js"

export const watchdogPingSocket = async (
  logger: any,
  sessionService: any,
  onWsCloseCb: (socket: SamaWsSocket | undefined, code: number) => Promise<void>,
  onTcpCloseCb: (socket: SamaTcpSocket | undefined) => Promise<void>,
): Promise<void> => {
  const users = Object.keys(sessionService.activeSessions.DEVICES)

  logger.debug("[start] %s", users.length)

  for (const userId of users) {
    const connections = sessionService.activeSessions.DEVICES[userId] ?? []
    for (const connection of connections) {
      if (!connection?.socket) {
        continue
      }

      const socket = connection.socket
      const isTCP = socket instanceof net.Socket
      const pingPackage = APIs[socket.apiType ?? BASE_API].pingPackage()

      try {
        if (isTCP) {
          await new Promise<void>((resolve, reject) => {
            socket.write(pingPackage, (error) => (error ? reject(error) : resolve()))
          })
        } else {
          socket.send(pingPackage)
        }
      } catch (error) {
        logger.error(error, "[error socket send] %s", userId)
        if (isTCP) {
          await onTcpCloseCb(socket)
            .then(() => logger.debug("[close tcp done] %s", userId))
            .catch((error) => logger.error(error, "[close tcp error]"))
        } else {
          await onWsCloseCb(socket, 10)
            .then(() => logger.debug("[close ws done] %s", userId))
            .catch((error) => logger.error(error, "[close ws error]"))
        }
        await sessionService.removeUserSession(socket, userId, connection.deviceId).catch((error) => logger.error(error, "[remove]"))
      }
    }
  }

  logger.debug("[finish]")
}
