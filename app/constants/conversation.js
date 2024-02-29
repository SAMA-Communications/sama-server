export const CONVERSATION_EVENTS = {
  CONVERSATION_EVENT: {
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
  },
  EVENT_TYPE_PARAMS: {
    create: {
      push_message_body: 'created a new conversation',
      event_request_name: 'conversation_created',
    },
    update: {
      push_message_body: 'added you to conversation',
      event_request_name: 'conversation_created',
    },
    delete: {
      push_message_body: 'removed you from conversation',
      event_request_name: 'conversation_kicked',
    },
  },
  ACTION_PARTICIPANT_MESSAGE: {
    added_participant: 'has been added to the group',
    removed_participant: 'has been removed from the group',
  },
}
