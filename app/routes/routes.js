import { activitiesSchemaValidation } from "../validations/activities_schema_validation.js";
import { conversationsSchemaValidation } from "../validations/conversations_schema_validation.js";
import { default as ContactsController } from "../controllers/users.js";
import { default as ConversationsController } from "../controllers/conversations.js";
import { default as FilesController } from "../controllers/files.js";
import { default as LastActivityiesController } from "../controllers/activities.js";
import { default as MessagesController } from "../controllers/messages.js";
import { default as OperationsLogController } from "../controllers/operations_log.js";
import { default as StatusesController } from "../controllers/status.js";
import { default as UsersBlockController } from "../controllers/users_block.js";
import { default as UsersController } from "../controllers/users.js";
import { filesSchemaValidation } from "../validations/files_schema_validation.js";
import { messagesSchemaValidation } from "../validations/messages_schema_validations.js";
import { operationsLogSchemaValidation } from "../validations/operations_log_schema_validation.js";
import { statusSchemaValidation } from "../validations/status_schema_validation.js";
import { usersBlockSchemaValidation } from "../validations/users_block_schema_validation.js";
import { usersSchemaValidation } from "../validations/users_schema_validation.js";
import { contactsSchemaValidation } from "../validations/contacts_schema_validations.js";

export const routes = {
  typing: (ws, json) =>
    StatusesController.validate(
      json.typing,
      statusSchemaValidation.typing
    ).typing(ws, json),
  message: (ws, json) =>
    MessagesController.validate(
      json.message,
      messagesSchemaValidation.create
    ).create(ws, json),
  message_edit: (ws, json) =>
    MessagesController.validate(
      json.message_edit,
      messagesSchemaValidation.edit
    ).edit(ws, json),
  message_list: (ws, json) =>
    MessagesController.validate(
      json.message_list,
      messagesSchemaValidation.list
    ).list(ws, json),
  message_read: (ws, json) =>
    MessagesController.validate(
      json.message_read,
      messagesSchemaValidation.read
    ).read(ws, json),
  message_delete: (ws, json) =>
    MessagesController.validate(
      json.message_delete,
      messagesSchemaValidation.delete
    ).delete(ws, json),
  user_create: (ws, json) =>
    UsersController.validate(
      json.user_create,
      usersSchemaValidation.create
    ).create(ws, json),
  user_edit: (ws, json) =>
    UsersController.validate(json.user_edit, usersSchemaValidation.edit).edit(
      ws,
      json
    ),
  user_login: (ws, json) =>
    UsersController.validate(
      json.user_login,
      usersSchemaValidation.login
    ).login(ws, json),
  user_logout: (ws, json) =>
    UsersController.validate(
      json.user_logout,
      usersSchemaValidation.logout
    ).logout(ws, json),
  user_delete: (ws, json) =>
    UsersController.validate(
      json.user_delete,
      usersSchemaValidation.delete
    ).delete(ws, json),
  user_search: (ws, json) =>
    UsersController.validate(
      json.user_search,
      usersSchemaValidation.search
    ).search(ws, json),
  contact_add: (ws, json) =>
    ContactsController.validate(
      json.contact_add,
      contactsSchemaValidation.contact_add
    ).search(ws, json),
  contact_batch_add: (ws, json) =>
    ContactsController.validate(
      json.contact_batch_add,
      contactsSchemaValidation.contact_batch_add
    ).search(ws, json),
  contact_update: (ws, json) =>
    ContactsController.validate(
      json.contact_update,
      contactsSchemaValidation.contact_update
    ).search(ws, json),
  contact_delete: (ws, json) =>
    ContactsController.validate(
      json.contact_delete,
      contactsSchemaValidation.contact_delete
    ).search(ws, json),
  contact_list: (ws, json) =>
    ContactsController.validate(
      json.contact_list,
      contactsSchemaValidation.contact_list
    ).search(ws, json),
  create_files: (ws, json) =>
    FilesController.validate(
      json.create_files,
      filesSchemaValidation.createUrl
    ).createUrl(ws, json),
  get_file_urls: (ws, json) =>
    FilesController.validate(
      json.get_file_urls,
      filesSchemaValidation.getDownloadUrl
    ).getDownloadUrl(ws, json),
  op_log_list: (ws, json) =>
    OperationsLogController.validate(
      json.op_log_list,
      operationsLogSchemaValidation.logs
    ).logs(ws, json),
  block_user: (ws, json) =>
    UsersBlockController.validate(
      json.block_user,
      usersBlockSchemaValidation.block
    ).block(ws, json),
  unblock_user: (ws, json) =>
    UsersBlockController.validate(
      json.unblock_user,
      usersBlockSchemaValidation.unblock
    ).unblock(ws, json),
  list_blocked_users: (ws, json) =>
    UsersBlockController.validate(
      json.list_blocked_users,
      usersBlockSchemaValidation.list
    ).list(ws, json),
  user_last_activity_subscribe: (ws, json) =>
    LastActivityiesController.validate(
      json.user_last_activity_subscribe,
      activitiesSchemaValidation.statusSubscribe
    ).statusSubscribe(ws, json),
  user_last_activity_unsubscribe: (ws, json) =>
    LastActivityiesController.validate(
      json.user_last_activity_unsubscribe,
      activitiesSchemaValidation.statusUnsubscribe
    ).statusUnsubscribe(ws, json),
  user_last_activity: (ws, json) =>
    LastActivityiesController.validate(
      json.user_last_activity,
      activitiesSchemaValidation.getUserStatus
    ).getUserStatus(ws, json),
  getParticipantsByCids: (ws, json) =>
    ConversationsController.validate(
      json.getParticipantsByCids,
      conversationsSchemaValidation.getParticipantsByCids
    ).getParticipantsByCids(ws, json),
  conversation_create: (ws, json) =>
    ConversationsController.validate(
      json.conversation_create,
      conversationsSchemaValidation.create
    ).create(ws, json),
  conversation_delete: (ws, json) =>
    ConversationsController.validate(
      json.conversation_delete,
      conversationsSchemaValidation.delete
    ).delete(ws, json),
  conversation_update: (ws, json) =>
    ConversationsController.validate(
      json.conversation_update,
      conversationsSchemaValidation.update
    ).update(ws, json),
  conversation_list: (ws, json) =>
    ConversationsController.validate(
      json.conversation_list,
      conversationsSchemaValidation.list
    ).list(ws, json),
};
