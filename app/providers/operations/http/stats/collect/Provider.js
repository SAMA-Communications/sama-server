import RegisterProvider from "../../../../../common/RegisterProvider.js"
import HttpStatsCollectOperation from "./index.js"

const name = "HttpStatsCollectOperation"

class HttpStatsCollectOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const statsService = slc.use("StatsService")

    return new HttpStatsCollectOperation(statsService)
  }
}

export default new HttpStatsCollectOperationRegisterProvider({
  name,
  implementationName: HttpStatsCollectOperation.name,
  scope: RegisterProvider.SCOPE.TRANSIENT,
})
