import StorageService from './index.js'
import RegisterProvider from '../../../common/RegisterProvider.js'

const name = 'StorageService'

class StorageServiceRegisterProvider extends RegisterProvider {
  register(slc) {
    const redisClient = slc.use('RedisClient')
    const storageDriverClient = slc.use('StorageDriverClient')
    const fileRepo = slc.use('FileRepository')

    return new StorageService(redisClient, storageDriverClient, fileRepo)
  }
}

export default new StorageServiceRegisterProvider({ name, implementationName: StorageService.name })