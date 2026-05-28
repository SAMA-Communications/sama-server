import RegisterProvider from "../../../../common/RegisterProvider.js"
import type { IServiceLocator } from "../../../../common/service-locator-types.js"
import type { Config } from "../../../../config/index.js"
import type { ProviderName } from "../../../../types/common.js"
import type SessionService from "../../../services/session/index.js"
import type UserService from "../../../services/user/index.js"

import UserAuthOperation from "./index.js"

const name: ProviderName = "UserAuthOperation"

class UserAuthOperationRegisterProvider extends RegisterProvider<UserAuthOperation> {
  register(slc: IServiceLocator): UserAuthOperation {
    const config = slc.use<Config>("Config")
    const sessionService = slc.use<SessionService>("SessionService")
    const userService = slc.use<UserService>("UserService")
    const userTokenRepo = slc.use<any>("UserTokenRepository")

    return new UserAuthOperation(config, sessionService, userService, userTokenRepo)
  }
}

export default new UserAuthOperationRegisterProvider({
  name,
  implementationName: UserAuthOperation.name,
  scope: RegisterProvider.SCOPE.TRANSIENT,
})
