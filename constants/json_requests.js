import ConversationController from "../controllers/conversations.js";
import FileController from "../controllers/files.js";
import LastActivityController from "../controllers/activities.js";
import MessagesController from "../controllers/messages.js";
import StatusController from "../controllers/status.js";
import UsersController from "../controllers/users.js";

const jsonKeys = {
  message: (ws, json) => new MessagesController().create(ws, json),
  typing: (ws, json) => new StatusController().typing(ws, json),
};
const jsonRequest = {
  message_edit: (ws, json) => new MessagesController().edit(ws, json),
  message_list: (ws, json) => new MessagesController().list(ws, json),
  message_read: (ws, json) => new MessagesController().read(ws, json),
  message_delete: (ws, json) => new MessagesController().delete(ws, json),
  create_file: (ws, json) => new FileController().createUrl(ws, json),
  get_file_url: (ws, json) => new FileController().getDownloadUrl(ws, json),
  user_create: (ws, json) => new UsersController().create(ws, json),
  user_edit: (ws, json) => new UsersController().edit(ws, json),
  user_login: (ws, json) => new UsersController().login(ws, json),
  user_logout: (ws, json) => new UsersController().logout(ws, json),
  user_delete: (ws, json) => new UsersController().delete(ws, json),
  user_search: (ws, json) => new UsersController().search(ws, json),
  user_last_activity_subscribe: (ws, json) =>
    new LastActivityController().statusSubscribe(ws, json),
  user_last_activity_unsubscribe: (ws, json) =>
    new LastActivityController().statusUnsubscribe(ws, json),
  user_last_activity: (ws, json) =>
    new LastActivityController().getUserStatus(ws, json),
  getParticipantsByCids: (ws, json) =>
    new ConversationController().getParticipantsByCids(ws, json),
  conversation_create: (ws, json) =>
    new ConversationController().create(ws, json),
  conversation_delete: (ws, json) =>
    new ConversationController().delete(ws, json),
  conversation_update: (ws, json) =>
    new ConversationController().update(ws, json),
  conversation_list: (ws, json) => new ConversationController().list(ws, json),
};

export { jsonKeys, jsonRequest };
