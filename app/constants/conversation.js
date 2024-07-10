export const CONVERSATION_EVENTS = {
  CONVERSATION_EVENT: {
    CREATE: "create",
    UPDATE: "update",
    UPDATE_IMAGE: "update_image",
    DELETE: "delete",
  },
  EVENT_TYPE_PARAMS: {
    create: {
      push_message_body: "created a new conversation",
      event_request_name: "conversation_created",
    },
    update: {
      push_message_body: "added you to conversation",
      event_request_name: "conversation_updated",
    },
    update_image: {
      push_message_body: "A new group chat image has been added",
      event_request_name: "conversation_updated",
    },
    delete: {
      push_message_body: "removed you from conversation",
      event_request_name: "conversation_kicked",
    },
  },
  CONVERSATION_PARTICIPANT_EVENT: {
    ADDED: "added_participant",
    REMOVED: "removed_participant",
    LEFT: "left_participants",
  },
  ACTION_PARTICIPANT_MESSAGE: {
    added_participant: "has been added to the group",
    removed_participant: "has been removed from the group",
    left_participants: "has left the group",
  },
}
