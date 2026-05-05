import net from "node:net"

export const socketCloseWatchdog = async (logger, sessionService, onWsCloseCb, onTcpCloseCb) => {
  const users = Object.keys(sessionService.activeSessions.DEVICES)

  logger.debug("[run] %s", users.length)

  for (const userId of users) {
    const connections = sessionService.activeSessions.DEVICES[userId] ?? []
    for (const connection of connections) {
      const isTCP = connection?.socket instanceof net.Socket
      try {
        if (isTCP) {
          connection?.socket?.write(" ")
        } else {
          connection?.socket?.send(" ")
        }
      } catch (error) {
        logger.error(error, "[error socket send] %s", userId)
        if (isTCP) {
          await onTcpCloseCb(connection?.socket).catch(error => logger.error(error, "[close tcp]"))
        } else {
          await onWsCloseCb(connection?.socket, 10).catch(error => logger.error(error, "[close ws]"))
        }
        await sessionService.removeUserSession(connection?.socket, userId, connection?.deviceId).catch(error => logger.error(error, "[remove]"))
      }
    }
  }
}