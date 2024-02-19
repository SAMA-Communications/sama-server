import RegisterProvider from '../../../common/RegisterProvider.js'
import UserToken from '../../../new_models/user_token.js'
import UserTokenRepository from './index.js'

const name = 'UserTokenRepository'

class UserTokenRepositoryRegisterProvider extends RegisterProvider {
  register(slc) {
    const mongoConnection = slc.use('MongoConnection')

    return new UserTokenRepository(mongoConnection, UserToken)
  }
}

export default new UserTokenRepositoryRegisterProvider({ name, implementationName: UserTokenRepository.name })