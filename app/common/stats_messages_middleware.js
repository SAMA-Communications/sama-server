import BaseMiddleware from "@sama/common/middleware.js"
import ServiceLocatorContainer from "@sama/common/ServiceLocatorContainer.js"

class StatsMessagesMiddleWare extends BaseMiddleware {
  handle(socket, message) {
    const statsService = ServiceLocatorContainer.use("StatsService")

    statsService.incMessagesCount(1)
  }
}

export default new StatsMessagesMiddleWare()
