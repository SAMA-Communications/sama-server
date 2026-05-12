import net from "node:net"
import { APIs, BASE_API } from "../networking/APIs.js"

export const watchdogPingSocket = async (logger, sessionService, onWsCloseCb, onTcpCloseCb) => {
  const users = Object.keys(sessionService.activeSessions.DEVICES)

  logger.debug("[start] %s", users.length)

  for (const userId of users) {
    const connections = sessionService.activeSessions.DEVICES[userId] ?? []
    for (const connection of connections) {
      if (!connection?.socket) {
        continue
      }

      const isTCP = connection.socket instanceof net.Socket
      const pingPackage = APIs[connection.socket?.apiType ?? BASE_API].pingPackage()

      try {
        if (isTCP) {
          await new Promise((resolve, reject) => {
            connection.socket?.write(pingPackage, (error) => error ? reject(error) : resolve())
          })
        } else {
          connection.socket?.send(pingPackage)
        }
      } catch (error) {
        logger.error(error, "[error socket send] %s", userId)
        if (isTCP) {
          await onTcpCloseCb(connection?.socket)
            .then(() => logger.debug("[close tcp done] %s", userId))
            .catch(error => logger.error(error, "[close tcp error]"))
        } else {
          await onWsCloseCb(connection?.socket, 10)
            .then(() => logger.debug("[close ws done] %s", userId))
            .catch(error => logger.error(error, "[close ws error]"))
        }
        await sessionService.removeUserSession(connection?.socket, userId, connection?.deviceId).catch(error => logger.error(error, "[remove]"))
      }
    }
  }

  logger.debug("[finish]")
}