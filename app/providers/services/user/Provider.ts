import RegisterProvider from "../../../common/RegisterProvider.js"
import type { IServiceLocator } from "../../../common/service-locator-types.js"
import type { ProviderName } from "../../../types/common.js"

import UserRepository from "../../repositories/user/index.js"

import UserService from "./index.js"

const name: ProviderName = "UserService"

class UserServiceRegisterProvider extends RegisterProvider<UserService> {
  register(slc: IServiceLocator): UserService {
    const userRepo = slc.use<UserRepository>("UserRepository")
    const storageService = slc.use<any>("StorageService")

    return new UserService(userRepo, storageService)
  }
}

export default new UserServiceRegisterProvider({ name, implementationName: UserService.name })
