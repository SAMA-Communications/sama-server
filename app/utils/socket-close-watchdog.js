import net from "node:net"

export const socketCloseWatchdog = (logger, sessionService, onWsCloseCb, onTcpCloseCb) => {
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
          onTcpCloseCb(connection?.socket)
        } else {
          onWsCloseCb(connection?.socket, 10)
        }
      }
    }
  }
}