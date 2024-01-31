import UserRepoProvider from './repositories/user/Provider.js'
import UserTokenRepoProvider from './repositories/user_token/Provider.js'
import FileRepoProvider from './repositories/file/Provider.js'

import UserService from './services/user/Provider.js'
import StorageServiceProvider from './services/storage/Provider.js'

import UserAuthOperationProvider from './operations/user/auth/Provider.js'

const providers = [
  UserRepoProvider,
  UserTokenRepoProvider,
  FileRepoProvider,

  UserService,
  StorageServiceProvider,

  UserAuthOperationProvider
]

export default providers