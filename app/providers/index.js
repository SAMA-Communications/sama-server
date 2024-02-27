import UserMapperProvider from './utils/mappers/user/Provider.js'
import ConversationMapperProvider from './utils/mappers/conversation/Provider.js'
import MessageMapperProvider from './utils/mappers/message/Provider.js'
 
import UserRepoProvider from './repositories/user/Provider.js'
import UserTokenRepoProvider from './repositories/user_token/Provider.js'
import FileRepoProvider from './repositories/file/Provider.js'
import ConversationRepoProvider from './repositories/conversation/Provider.js'
import ConversationParticipantRepoProvider from './repositories/conversation_participants/Provider.js'
import MessageRepoProvider from './repositories/message/Provider.js'
import MessageStatusRepoProvider from './repositories/message_status/Provider.js'

import SessionServiceProvider from './services/session/Provider.js'
import UserServiceProvider from './services/user/Provider.js'
import StorageServiceProvider from './services/storage/Provider.js'
import ActivityManagerServiceProvider from './services/activity_manager/Provider.js'
import ConversationServiceProvider from './services/conversation/Provider.js'
import MessageServiceProvider from './services/message/Provider.js'

import UserAuthOperationProvider from './operations/user/auth/Provider.js'
import UserLogoutOperationProvider from './operations/user/logout/Provider.js'
import UserCreateOperationProvider from './operations/user/create/Provider.js'
import UserEditOperationProvider from './operations/user/edit/Provider.js'
import UserDeleteOperationProvider from './operations/user/delete/Provider.js'
import UserSearchOperationProvider from './operations/user/search/Provider.js'

import ActivityUserRetrieveOperationProvider from './operations/activity/retrieve/Provider.js'
import ActivityUserSubscribeOperationProvider from './operations/activity/subscribe/Provider.js'
import ActivityUserUnsubscribeOperationProvider from './operations/activity/unsubscribe/Provider.js'

import ConversationCreateOperationProvider from './operations/conversation/create/Provider.js'
import ConversationEditOperationProvider from './operations/conversation/edit/Provider.js'
import ConversationListOperationProvider from './operations/conversation/list/Provider.js'
import ConversationListParticipantsOperationProvider from './operations/conversation/list_participants/Provider.js'
import ConversationDeleteOperationProvider from './operations/conversation/delete/Provider.js'

import MessageCreateOperationProvider from './operations/message/create/Provider.js'

const providers = [
  UserMapperProvider,
  ConversationMapperProvider,
  MessageMapperProvider,

  UserRepoProvider,
  UserTokenRepoProvider,
  FileRepoProvider,
  ConversationRepoProvider,
  ConversationParticipantRepoProvider,
  MessageRepoProvider,
  MessageStatusRepoProvider,

  SessionServiceProvider,
  UserServiceProvider,
  StorageServiceProvider,
  ActivityManagerServiceProvider,
  ConversationServiceProvider,
  MessageServiceProvider,

  UserAuthOperationProvider,
  UserLogoutOperationProvider,
  UserCreateOperationProvider,
  UserEditOperationProvider,
  UserDeleteOperationProvider,
  UserSearchOperationProvider,

  ActivityUserRetrieveOperationProvider,
  ActivityUserSubscribeOperationProvider,
  ActivityUserUnsubscribeOperationProvider,

  ConversationCreateOperationProvider,
  ConversationEditOperationProvider,
  ConversationListOperationProvider,
  ConversationListParticipantsOperationProvider,
  ConversationDeleteOperationProvider,

  MessageCreateOperationProvider
]

export default providers