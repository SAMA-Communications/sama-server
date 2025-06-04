import HelpersProvider from "./utils/helpers/Provider.js"

import BaseMapperProvider from "./utils/mappers/base/Provider.js"
import UserMapperProvider from "./utils/mappers/user/Provider.js"
import ConversationMapperProvider from "./utils/mappers/conversation/Provider.js"
import MessageMapperProvider from "./utils/mappers/message/Provider.js"

import ClusterNodeRepositoryProvider from "./repositories/cluster_node/Provider.js"
import UserRepoProvider from "./repositories/user/Provider.js"
import UserTokenRepoProvider from "./repositories/user_token/Provider.js"
import BlockedUserRepoProvider from "./repositories/blocked_user/Provider.js"
import FileRepoProvider from "./repositories/file/Provider.js"
import ConversationRepoProvider from "./repositories/conversation/Provider.js"
import ConversationHandlerRepoProvider from "./repositories/conversation_handler/Provider.js"
import ConversationParticipantRepoProvider from "./repositories/conversation_participants/Provider.js"
import MessageRepoProvider from "./repositories/message/Provider.js"
import MessageStatusRepoProvider from "./repositories/message_status/Provider.js"
import MessageReactionRepoProvider from "./repositories/message_reaction/Provider.js"
import ContactRepositoryProvider from "./repositories/contact/Provider.js"
import OperationsLogRepositoryProvider from "./repositories/operations_log/Provider.js"
import PushEventRepositoryProvider from "./repositories/push_event/Provider.js"
import PushSubscriptionRepositoryProvider from "./repositories/push_subscriptions/Provider.js"
import OrganizationRepositoryProvider from "./repositories/organization/Provider.js"

import ClusterNodeServiceProvider from "./services/cluster_node/Provider.js"
import SessionServiceProvider from "./services/session/Provider.js"
import UserServiceProvider from "./services/user/Provider.js"
import BlockListServiceProvider from "./services/block_list/Provider.js"
import StorageServiceProvider from "./services/storage/Provider.js"
import OperationsLogServiceProvider from "./services/operation_logs/Provider.js"
import ActivityManagerServiceProvider from "./services/activity_manager/Provider.js"
import ConversationServiceProvider from "./services/conversation/Provider.js"
import ConversationHandlerServiceProvider from "./services/conversation_handler/Provider.js"
import MessageServiceProvider from "./services/message/Provider.js"
import ConversationNotificationProvider from "./services/conversation_notification/Provider.js"
import ContactServiceProvider from "./services/contacts/Provider.js"
import PushNotificationServiceProvider from "./services/push_notifications/Provider.js"
import PushQueueServiceProvider from "./services/push_queue_service/Provider.js"
import OrganizationServiceProvider from "./services/organization/Provider.js"

// WS Operations Providers

import UserAuthOperationProvider from "./operations/user/auth/Provider.js"
import UserLogoutOperationProvider from "./operations/user/logout/Provider.js"
import UserCreateOperationProvider from "./operations/user/create/Provider.js"
import UserEditOperationProvider from "./operations/user/edit/Provider.js"
import UserDeleteOperationProvider from "./operations/user/delete/Provider.js"
import UserSearchOperationProvider from "./operations/user/search/Provider.js"
import UserListOperationProvider from "./operations/user/list/Provider.js"
import UserConnectSocketOperationProvider from "./operations/user/connect/Provider.js"

import BlockListBlockOperationProvider from "./operations/block_list/block/Provider.js"
import BlockListUnblockOperationProvider from "./operations/block_list/unblock/Provider.js"
import BlockListEnableOperationProvider from "./operations/block_list/enable/Provider.js"
import BlockListRetrieveOperationProvider from "./operations/block_list/list/Provider.js"

import FileCreateOperationProvider from "./operations/file/create/Provider.js"
import FileDownloadOperationProvider from "./operations/file/download/Provider.js"

import ActivityUserRetrieveOperationProvider from "./operations/activity/retrieve/Provider.js"
import ActivityUserSubscribeOperationProvider from "./operations/activity/subscribe/Provider.js"
import ActivityUserUnsubscribeOperationProvider from "./operations/activity/unsubscribe/Provider.js"
import OnlineListOperationProvider from "./operations/activity/online_list/Provider.js"

import ConversationCreateOperationProvider from "./operations/conversation/create/Provider.js"
import ConversationEditOperationProvider from "./operations/conversation/edit/Provider.js"
import ConversationListOperationProvider from "./operations/conversation/list/Provider.js"
import ConversationListParticipantsOperationProvider from "./operations/conversation/list_participants/Provider.js"
import ConversationDeleteOperationProvider from "./operations/conversation/delete/Provider.js"
import ConversationSearchOperationProvider from "./operations/conversation/search/Provider.js"
import ConversationSubscribeUnsubscribeOperationProvider from "./operations/conversation/subscribe_unsubscribe/Provider.js"

import ConversationHandlerCreateOperationProvider from "./operations/conversation_handlers/create/Provider.js"
import ConversationHandlerGetOperationProvider from "./operations/conversation_handlers/get/Provider.js"
import ConversationHandlerDeleteOperationProvider from "./operations/conversation_handlers/delete/Provider.js"

import MessageCreateOperationProvider from "./operations/message/create/Provider.js"
import MessageEditOperationProvider from "./operations/message/edit/Provider.js"
import MessageReadOperationProvider from "./operations/message/read/Provider.js"
import MessageDeleteOperationProvider from "./operations/message/delete/Provider.js"
import MessageListOperationProvider from "./operations/message/list/Provider.js"
import MessageReactionsUpdateOperationProvider from "./operations/message/reactions_update/Provider.js"
import MessageReactionsListOperationProvider from "./operations/message/reactions_list/Provider.js"
import MessageSendSystemOperationProvider from "./operations/message/system/Provider.js"

import OpLogsListOperationProvider from "./operations/operation_logs/list/Provider.js"

import StatusTypingOperationProvider from "./operations/status/typing/Provider.js"

import ContactCreateOperationProvider from "./operations/contact/create/Provider.js"
import ContactEditOperationProvider from "./operations/contact/edit/Provider.js"
import ContactListOperationProvider from "./operations/contact/list/Provider.js"
import ContactDeleteOperationProvider from "./operations/contact/delete/Provider.js"

import PushEventCreateOperationProvider from "./operations/push_notifications/create_event/Provider.js"
import PushSubscriptionCreateOperationProvider from "./operations/push_notifications/create_subscription/Provider.js"
import PushSubscriptionDeleteOperationProvider from "./operations/push_notifications/delete_subscription/Provider.js"
import PushSubscriptionListOperationProvider from "./operations/push_notifications/list_subscriptions/Provider.js"

// Http Operations Providers

import HttpUserAuthOperationProvider from "./operations/http/user/auth/Provider.js"
import HttpUserLogoutOperationProvider from "./operations/http/user/logout/Provider.js"

import HttpMessageCreateOperationProvider from "./operations/http/message/create/Provider.js"
import HttpMessageSystemOperationProvider from "./operations/http/message/system/Provider.js"
import HttpMessageReadOperationProvider from "./operations/http/message/read/Provider.js"
import HttpMessageEditOperationProvider from "./operations/http/message/edit/Provider.js"
import HttpMessageReactionOperationProvider from "./operations/http/message/reaction/Provider.js"
import HttpMessageDeleteOperationProvider from "./operations/http/message/delete/Provider.js"

import HttpActivityOnlineListOperationProvider from "./operations/http/activity/online_list/Provider.js"

import HttpOrganizationCreateOperation from "./operations/http/organization/create/Provider.js"

const providers = [
  HelpersProvider,

  BaseMapperProvider,
  UserMapperProvider,
  ConversationMapperProvider,
  MessageMapperProvider,

  ClusterNodeRepositoryProvider,
  UserRepoProvider,
  UserTokenRepoProvider,
  BlockedUserRepoProvider,
  FileRepoProvider,
  ConversationRepoProvider,
  ConversationHandlerRepoProvider,
  ConversationParticipantRepoProvider,
  MessageRepoProvider,
  MessageStatusRepoProvider,
  MessageReactionRepoProvider,
  ContactRepositoryProvider,
  OperationsLogRepositoryProvider,
  PushEventRepositoryProvider,
  PushSubscriptionRepositoryProvider,
  OrganizationRepositoryProvider,

  ClusterNodeServiceProvider,
  SessionServiceProvider,
  UserServiceProvider,
  BlockListServiceProvider,
  StorageServiceProvider,
  OperationsLogServiceProvider,
  ActivityManagerServiceProvider,
  ConversationServiceProvider,
  ConversationHandlerServiceProvider,
  MessageServiceProvider,
  ConversationNotificationProvider,
  ContactServiceProvider,
  PushNotificationServiceProvider,
  PushQueueServiceProvider,
  OrganizationServiceProvider,

  // WS Operations Providers

  UserAuthOperationProvider,
  UserLogoutOperationProvider,
  UserCreateOperationProvider,
  UserEditOperationProvider,
  UserDeleteOperationProvider,
  UserSearchOperationProvider,
  UserListOperationProvider,
  UserConnectSocketOperationProvider,

  BlockListBlockOperationProvider,
  BlockListUnblockOperationProvider,
  BlockListEnableOperationProvider,
  BlockListRetrieveOperationProvider,

  FileCreateOperationProvider,
  FileDownloadOperationProvider,

  ActivityUserRetrieveOperationProvider,
  ActivityUserSubscribeOperationProvider,
  ActivityUserUnsubscribeOperationProvider,
  OnlineListOperationProvider,

  ConversationCreateOperationProvider,
  ConversationEditOperationProvider,
  ConversationListOperationProvider,
  ConversationListParticipantsOperationProvider,
  ConversationDeleteOperationProvider,
  ConversationSearchOperationProvider,
  ConversationSubscribeUnsubscribeOperationProvider,

  ConversationHandlerCreateOperationProvider,
  ConversationHandlerGetOperationProvider,
  ConversationHandlerDeleteOperationProvider,

  MessageCreateOperationProvider,
  MessageEditOperationProvider,
  MessageReadOperationProvider,
  MessageDeleteOperationProvider,
  MessageListOperationProvider,
  MessageReactionsUpdateOperationProvider,
  MessageReactionsListOperationProvider,
  MessageSendSystemOperationProvider,

  OpLogsListOperationProvider,

  StatusTypingOperationProvider,

  ContactCreateOperationProvider,
  ContactEditOperationProvider,
  ContactListOperationProvider,
  ContactDeleteOperationProvider,

  PushEventCreateOperationProvider,
  PushSubscriptionCreateOperationProvider,
  PushSubscriptionDeleteOperationProvider,
  PushSubscriptionListOperationProvider,

  // Http Operations Providers

  HttpUserAuthOperationProvider,
  HttpUserLogoutOperationProvider,

  HttpMessageCreateOperationProvider,
  HttpMessageSystemOperationProvider,
  HttpMessageReadOperationProvider,
  HttpMessageEditOperationProvider,
  HttpMessageReactionOperationProvider,
  HttpMessageDeleteOperationProvider,

  HttpActivityOnlineListOperationProvider,

  HttpOrganizationCreateOperation,
]

export default providers
