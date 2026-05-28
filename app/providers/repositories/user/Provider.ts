import type { Db } from "mongodb"

import RegisterProvider from "../../../common/RegisterProvider.js"
import type { IServiceLocator } from "../../../common/service-locator-types.js"
import type { ProviderName } from "../../../types/common.js"
import User from "../../../models/user.js"

import UserRepository from "./index.js"

const name: ProviderName = "UserRepository"

class UserRepositoryRegisterProvider extends RegisterProvider<UserRepository> {
  register(slc: IServiceLocator): UserRepository {
    const mongoConnection = slc.use<Db>("MongoConnection")
    const userMapper = slc.use<any>("UserMapper")

    return new UserRepository(mongoConnection, User, userMapper)
  }
}

export default new UserRepositoryRegisterProvider({ name, implementationName: UserRepository.name })
