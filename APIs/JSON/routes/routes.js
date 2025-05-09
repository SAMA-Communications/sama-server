import { default as ContactsController } from "../controllers/contacts.js"
import { default as ConversationsController } from "../controllers/conversations.js"
import { default as ConversationSchemesController } from "../controllers/conversation_handlers.js"
import { default as FilesController } from "../controllers/files.js"
import { default as LastActivityiesController } from "../controllers/activities.js"
import { default as MessagesController } from "../controllers/messages.js"
import { default as OperationsLogController } from "../controllers/operations_log.js"
import { default as PushNotificationsController } from "../controllers/push_notifications.js"
import { default as StatusesController } from "../controllers/status.js"
import { default as UsersBlockController } from "../controllers/users_block.js"
import { default as UsersController } from "../controllers/users.js"

import authGuardMiddleware from "../middleware/auth_guard.js"

import { activitiesSchemaValidation } from "../validations/activities_schema_validation.js"
import { contactsSchemaValidation } from "../validations/contacts_schema_validation.js"
import { conversationsSchemaValidation } from "../validations/conversations_schema_validation.js"
import { conversationHandlersSchemaValidation } from "../validations/conversation_handlers_schema_validation.js"
import { filesSchemaValidation } from "../validations/files_schema_validation.js"
import { messagesSchemaValidation } from "../validations/messages_schema_validation.js"
import { operationsLogSchemaValidation } from "../validations/operations_log_schema_validation.js"
import { pushNotificationsSchemaValidation } from "../validations/push_notifications_schema_validation.js"
import { statusSchemaValidation } from "../validations/status_schema_validation.js"
import { usersBlockSchemaValidation } from "../validations/users_block_schema_validation.js"
import { usersSchemaValidation } from "../validations/users_schema_validation.js"

export const routes = {
  typing: (ws, json) =>
    StatusesController.middleware(authGuardMiddleware, ws, json)
      .validate(json.typing, statusSchemaValidation.typing)
      .typing(ws, json),
  message: (ws, json) =>
    MessagesController.middleware(authGuardMiddleware, ws, json)
      .validate(json.message, messagesSchemaValidation.create)
      .create(ws, json),
  message_edit: (ws, json) =>
    MessagesController.middleware(authGuardMiddleware, ws, json)
      .middleware(authGuardMiddleware, ws, json)
      .validate(json.message_edit, messagesSchemaValidation.edit)
      .edit(ws, json),
  message_reactions_update: (ws, json) =>
    MessagesController.middleware(authGuardMiddleware, ws, json)
      .middleware(authGuardMiddleware, ws, json)
      .validate(json.message_reactions_update, messagesSchemaValidation.reactions_update)
      .reactions_update(ws, json),
  message_list: (ws, json) =>
    MessagesController.middleware(authGuardMiddleware, ws, json)
      .validate(json.message_list, messagesSchemaValidation.list)
      .list(ws, json),
  message_reactions_list: (ws, json) =>
    MessagesController.middleware(authGuardMiddleware, ws, json)
      .middleware(authGuardMiddleware, ws, json)
      .validate(json.message_reactions_list, messagesSchemaValidation.reactions_list)
      .reactions_list(ws, json),
  message_read: (ws, json) =>
    MessagesController.middleware(authGuardMiddleware, ws, json)
      .validate(json.message_read, messagesSchemaValidation.read)
      .read(ws, json),
  message_delete: (ws, json) =>
    MessagesController.middleware(authGuardMiddleware, ws, json)
      .validate(json.message_delete, messagesSchemaValidation.delete)
      .delete(ws, json),
  system_message: (ws, json) =>
    MessagesController.middleware(authGuardMiddleware, ws, json)
      .validate(json.system_message, messagesSchemaValidation.system)
      .sendSystem(ws, json),
  connect: (ws, json) =>
    UsersController.middleware(authGuardMiddleware, ws, json)
      .validate(json.connect, usersSchemaValidation.connect)
      .connect(ws, json),
  user_create: (ws, json) =>
    UsersController.middleware(authGuardMiddleware, ws, json)
      .validate(json.user_create, usersSchemaValidation.create)
      .create(ws, json),
  user_edit: (ws, json) =>
    UsersController.middleware(authGuardMiddleware, ws, json)
      .validate(json.user_edit, usersSchemaValidation.edit)
      .middleware(authGuardMiddleware, ws, json)
      .edit(ws, json),
  /**
   * @deprecated **WARNING**: `user_login` request is deprecated
   * Therefore, we recommend using the new http route `/login` for user authorization.
   */
  user_login: (ws, json) =>
    UsersController.middleware(authGuardMiddleware, ws, json)
      .validate(json.user_login, usersSchemaValidation.login)
      .login(ws, json),
  /**
   * @deprecated **WARNING**: `user_logout` request is deprecated
   * Therefore, we recommend using the new http route `/logout` to log the user out of the system.
   */
  user_logout: (ws, json) =>
    UsersController.middleware(authGuardMiddleware, ws, json)
      .validate(json.user_logout, usersSchemaValidation.logout)
      .logout(ws, json),
  user_delete: (ws, json) =>
    UsersController.middleware(authGuardMiddleware, ws, json)
      .validate(json.user_delete, usersSchemaValidation.delete)
      .delete(ws, json),
  user_search: (ws, json) =>
    UsersController.middleware(authGuardMiddleware, ws, json)
      .validate(json.user_search, usersSchemaValidation.search)
      .search(ws, json),
  get_users_by_ids: (ws, json) =>
    UsersController.middleware(authGuardMiddleware, ws, json)
      .validate(json.get_users_by_ids, usersSchemaValidation.list)
      .list(ws, json),
  contact_add: (ws, json) =>
    ContactsController.middleware(authGuardMiddleware, ws, json)
      .validate(json.contact_add, contactsSchemaValidation.contact_add)
      .contact_add(ws, json),
  contact_batch_add: (ws, json) =>
    ContactsController.middleware(authGuardMiddleware, ws, json)
      .validate(json.contact_batch_add, contactsSchemaValidation.contact_batch_add)
      .contact_batch_add(ws, json),
  contact_update: (ws, json) =>
    ContactsController.middleware(authGuardMiddleware, ws, json)
      .validate(json.contact_update, contactsSchemaValidation.contact_update)
      .contact_update(ws, json),
  contact_delete: (ws, json) =>
    ContactsController.middleware(authGuardMiddleware, ws, json)
      .validate(json.contact_delete, contactsSchemaValidation.contact_delete)
      .contact_delete(ws, json),
  contact_list: (ws, json) =>
    ContactsController.middleware(authGuardMiddleware, ws, json)
      .validate(json.contact_list, contactsSchemaValidation.contact_list)
      .contact_list(ws, json),
  create_files: (ws, json) =>
    FilesController.middleware(authGuardMiddleware, ws, json)
      .validate(json.create_files, filesSchemaValidation.create_url)
      .create_url(ws, json),
  get_file_urls: (ws, json) =>
    FilesController.middleware(authGuardMiddleware, ws, json)
      .validate(json.get_file_urls, filesSchemaValidation.get_download_url)
      .get_download_url(ws, json),
  op_log_list: (ws, json) =>
    OperationsLogController.middleware(authGuardMiddleware, ws, json)
      .validate(json.op_log_list, operationsLogSchemaValidation.logs)
      .logs(ws, json),
  block_user: (ws, json) =>
    UsersBlockController.middleware(authGuardMiddleware, ws, json)
      .validate(json.block_user, usersBlockSchemaValidation.block)
      .block(ws, json),
  unblock_user: (ws, json) =>
    UsersBlockController.middleware(authGuardMiddleware, ws, json)
      .validate(json.unblock_user, usersBlockSchemaValidation.unblock)
      .unblock(ws, json),
  list_blocked_users: (ws, json) =>
    UsersBlockController.middleware(authGuardMiddleware, ws, json)
      .validate(json.list_blocked_users, usersBlockSchemaValidation.list)
      .list(ws, json),
  block_list_enable: (ws, json) =>
    UsersBlockController.middleware(authGuardMiddleware, ws, json)
      .validate(json.block_list_enable, usersBlockSchemaValidation.enable)
      .enable(ws, json),
  user_last_activity_subscribe: (ws, json) =>
    LastActivityiesController.middleware(authGuardMiddleware, ws, json)
      .validate(json.user_last_activity_subscribe, activitiesSchemaValidation.status_subscribe)
      .status_subscribe(ws, json),
  user_last_activity_unsubscribe: (ws, json) =>
    LastActivityiesController.middleware(authGuardMiddleware, ws, json)
      .validate(json.user_last_activity_unsubscribe, activitiesSchemaValidation.status_unsubscribe)
      .status_unsubscribe(ws, json),
  user_last_activity: (ws, json) =>
    LastActivityiesController.middleware(authGuardMiddleware, ws, json)
      .validate(json.user_last_activity, activitiesSchemaValidation.get_user_status)
      .get_user_status(ws, json),
  online_list: (ws, json) =>
    LastActivityiesController.middleware(authGuardMiddleware, ws, json)
      .validate(json.online_list, activitiesSchemaValidation.online_list)
      .online_list(ws, json),
  get_participants_by_cids: (ws, json) =>
    ConversationsController.middleware(authGuardMiddleware, ws, json)
      .validate(json.get_participants_by_cids, conversationsSchemaValidation.get_participants_by_cids)
      .get_participants_by_cids(ws, json),
  conversation_create: (ws, json) =>
    ConversationsController.middleware(authGuardMiddleware, ws, json)
      .validate(json.conversation_create, conversationsSchemaValidation.create)
      .create(ws, json),
  conversation_delete: (ws, json) =>
    ConversationsController.middleware(authGuardMiddleware, ws, json)
      .validate(json.conversation_delete, conversationsSchemaValidation.delete)
      .delete(ws, json),
  conversation_update: (ws, json) =>
    ConversationsController.middleware(authGuardMiddleware, ws, json)
      .validate(json.conversation_update, conversationsSchemaValidation.update)
      .update(ws, json),
  conversation_list: (ws, json) =>
    ConversationsController.middleware(authGuardMiddleware, ws, json)
      .validate(json.conversation_list, conversationsSchemaValidation.list)
      .list(ws, json),
  conversation_search: (ws, json) =>
    ConversationsController.middleware(authGuardMiddleware, ws, json)
      .validate(json.conversation_search, conversationsSchemaValidation.search)
      .search(ws, json),
  conversation_handler_create: (ws, json) =>
    ConversationSchemesController.middleware(authGuardMiddleware, ws, json)
      .validate(json.conversation_handler_create, conversationHandlersSchemaValidation.create)
      .create(ws, json),
  get_conversation_handler: (ws, json) =>
    ConversationSchemesController.middleware(authGuardMiddleware, ws, json)
      .validate(json.get_conversation_handler, conversationHandlersSchemaValidation.get)
      .get(ws, json),
  conversation_handler_delete: (ws, json) =>
    ConversationSchemesController.middleware(authGuardMiddleware, ws, json)
      .validate(json.conversation_handler_delete, conversationHandlersSchemaValidation.delete)
      .delete(ws, json),
  push_subscription_create: (ws, json) =>
    PushNotificationsController.middleware(authGuardMiddleware, ws, json)
      .validate(json.push_subscription_create, pushNotificationsSchemaValidation.push_subscription_create)
      .push_subscription_create(ws, json),
  push_subscription_list: (ws, json) =>
    PushNotificationsController.middleware(authGuardMiddleware, ws, json)
      .validate(json.push_subscription_list, pushNotificationsSchemaValidation.push_subscription_list)
      .push_subscription_list(ws, json),
  push_subscription_delete: (ws, json) =>
    PushNotificationsController.middleware(authGuardMiddleware, ws, json)
      .validate(json.push_subscription_delete, pushNotificationsSchemaValidation.push_subscription_delete)
      .push_subscription_delete(ws, json),
  push_event_create: (ws, json) =>
    PushNotificationsController.middleware(authGuardMiddleware, ws, json)
      .validate(json.push_event_create, pushNotificationsSchemaValidation.push_event_create)
      .push_event_create(ws, json),
}
