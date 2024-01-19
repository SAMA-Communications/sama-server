import FileRepository from './index.js'

import File from '../../../models/file.js'

const register = (slc) => {
  slc.register('FileRepository', (slc) => {
    return new FileRepository(File)
  })
}

const boot = async (slc) => {
  console.log('[Boot] [FileRepository]')
}

export default { register, boot }