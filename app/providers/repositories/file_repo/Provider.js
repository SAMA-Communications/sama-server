import FileRepository from './index.js'
import RegisterProvider from '../../../common/RegisterProvider.js'
import File from '../../../models/file.js'

const name = 'FileRepository'

class FileRepositoryRegisterProvider extends RegisterProvider {
  register(slc) {
    return new FileRepository(File)
  }
}

export default new FileRepositoryRegisterProvider({ name, implementationName: FileRepository.name })