import UserMapperProvider from './utils/mappers/user/Provider.js'

import UserRepoProvider from './repositories/user/Provider.js'
import UserTokenRepoProvider from './repositories/user_token/Provider.js'
import FileRepoProvider from './repositories/file/Provider.js'

import UserService from './services/user/Provider.js'
import StorageServiceProvider from './services/storage/Provider.js'
import ActivityManagerServiceProvider from './services/activity_manager/Provider.js'

import UserAuthOperationProvider from './operations/user/auth/Provider.js'
import UserLogoutOperationProvider from './operations/user/logout/Provider.js'
import UserCreateOperationProvider from './operations/user/create/Provider.js'
import UserEditOperationProvider from './operations/user/edit/Provider.js'
import UserDeleteOperationProvider from './operations/user/delete/Provider.js'
import UserSearchOperationProvider from './operations/user/search/Provider.js'

import ActivityUserRetrieveOperationProvider from './operations/activity/retrieve/Provider.js'
import ActivityUserSubscribeOperationProvider from './operations/activity/subscribe/Provider.js'
import ActivityUserUnsubscribeOperationProvider from './operations/activity/unsubscribe/Provider.js'

const providers = [
  UserMapperProvider,

  UserRepoProvider,
  UserTokenRepoProvider,
  FileRepoProvider,

  UserService,
  StorageServiceProvider,
  ActivityManagerServiceProvider,

  UserAuthOperationProvider,
  UserLogoutOperationProvider,
  UserCreateOperationProvider,
  UserEditOperationProvider,
  UserDeleteOperationProvider,
  UserSearchOperationProvider,

  ActivityUserRetrieveOperationProvider,
  ActivityUserSubscribeOperationProvider,
  ActivityUserUnsubscribeOperationProvider
]

export default providers