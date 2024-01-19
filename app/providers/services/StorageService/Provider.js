import StorageService from './index.js'

const register = (slc) => {
  slc.register('StorageService', (slc) => {
    const redisClient = slc.use('RedisClient')
    const storageDriverClient = slc.use('StorageDriverClient')
    const fileRepo = slc.use('FileRepository')

    return new StorageService(redisClient, storageDriverClient, fileRepo)
  })
}

const boot = async (slc) => {
  console.log('[Boot] [StorageService]')
}

export default { register, boot }