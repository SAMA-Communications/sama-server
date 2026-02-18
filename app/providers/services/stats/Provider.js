import RegisterProvider from "../../../common/RegisterProvider.js"
import StatsService from "./index.js"

const name = "StatsService"

class StatsServiceRegisterProvider extends RegisterProvider {
  register(slc) {
    const config = slc.use("Config")
    const sessionService = slc.use("SessionService")

    return new StatsService(config, sessionService)
  }
}

export default new StatsServiceRegisterProvider({ name, implementationName: StatsService.name })
