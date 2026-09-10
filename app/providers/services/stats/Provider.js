import RegisterProvider from "../../../common/RegisterProvider.js"
import StatsService from "./index.js"

const name = "StatsService"

class StatsServiceRegisterProvider extends RegisterProvider {
  register(slc) {
    const config = slc.use("Config")
    const sessionService = slc.use("SessionService")
    const mongoConnection = slc.use("MongoConnection")
    const redisClient = slc.use("RedisClient")

    return new StatsService(config, sessionService, mongoConnection, redisClient)
  }
}

export default new StatsServiceRegisterProvider({ name, implementationName: StatsService.name })
