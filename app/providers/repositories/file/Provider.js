import RegisterProvider from '../../../common/RegisterProvider.js'
import File from '../../../new_models/file.js'
import FileRepository from './index.js'

const name = 'FileRepository'

class FileRepositoryRegisterProvider extends RegisterProvider {
  register(slc) {
    const mongoConnection = slc.use('MongoConnection')
    const baseMapper = slc.use('BaseMapper')

    return new FileRepository(mongoConnection, File, baseMapper)
  }
}

export default new FileRepositoryRegisterProvider({ name, implementationName: FileRepository.name })