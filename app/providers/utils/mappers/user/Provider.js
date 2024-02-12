import RegisterProvider from '../../../../common/RegisterProvider.js'
import userMapper from './index.js'

const name = 'UserMapper'

class UserMapperRegisterProvider extends RegisterProvider {
  register(slc) {
    return userMapper
  }
}

export default new UserMapperRegisterProvider({ name, implementationName: userMapper.name })