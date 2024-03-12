import RegisterProvider from '../../../common/RegisterProvider.js'
import User from '../../../new_models/user.js'
import UserRepository from './index.js'

const name = 'UserRepository'

class UserRepositoryRegisterProvider extends RegisterProvider {
  register(slc) {
    const mongoConnection = slc.use('MongoConnection')
    const userMapper = slc.use('UserMapper')

    return new UserRepository(mongoConnection, User, userMapper)
  }
}

export default new UserRepositoryRegisterProvider({ name, implementationName: UserRepository.name })