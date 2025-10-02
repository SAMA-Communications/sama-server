import { CONVERSATION_EVENTS } from "../../../constants/conversation.js"
import CreatePushEventOptions from "@sama/providers/services/push_queue_service/models/CreatePushEventOptions.js"

import MessagePublicFields from "@sama/DTO/Response/message/create/public_fields.js"
import MessageResponse from "@sama/DTO/Response/message/create/response.js"

import SystemMessagePublicFields from "@sama/DTO/Response/message/system/public_fields.js"
import SystemMessageResponse from "@sama/DTO/Response/message/system/response.js"

class ConversationNotificationService {
  constructor(helpers, messageService) {
    this.helpers = helpers
    this.messageService = messageService
  }

  isEnabled() {
    return process.env.CONVERSATION_NOTIFICATIONS_ENABLED === "true"
  }

  async actionEvent(eventType, conversation, user) {
    const userDisplayName = this.helpers.getDisplayName(user)
    const eventParams = CONVERSATION_EVENTS.EVENT_TYPE_PARAMS[eventType]

    const pushPayload = {
      title: conversation.name,
      cid: conversation._id,
      body: `${userDisplayName} ${eventParams.push_message_body}`,
    }

    const createSystemMessageParams = {
      id: conversation._id.toString(),
      from: user.native_id.toString(),
      x: { [eventParams.event_request_name]: conversation.visibleParams() },
      cid: conversation._id.toString(),
      t: this.helpers.currentTimeStamp(),
    }

    const eventMessage = new SystemMessageResponse(new SystemMessagePublicFields(createSystemMessageParams))

    const eventNotification = new CreatePushEventOptions(user.native_id, pushPayload, {})

    return { message: eventMessage, notification: eventNotification }
  }

  async imageActionEvent(eventType, conversation, userActionCreator) {
    const eventParams = CONVERSATION_EVENTS.EVENT_TYPE_PARAMS[eventType]

    const createMessageParams = {
      cid: conversation._id,
      body: `${eventParams.push_message_body}`,
      x: { type: eventType, conversation: conversation.visibleParams() },
    }

    const createdMessage = await this.messageService.create(userActionCreator, conversation, [], createMessageParams)

    const userActionCreatorDisplayName = this.helpers.getDisplayName(userActionCreator)
    const pushPayload = {
      title: `${userActionCreatorDisplayName} | ${conversation.name}`,
      body: createdMessage.body,
      cid: createdMessage.cid,
    }

    const eventMessage = new MessageResponse(new MessagePublicFields(createdMessage))

    const eventNotification = new CreatePushEventOptions(userActionCreator, conversation, pushPayload, {})

    return { message: eventMessage, notification: eventNotification }
  }

  async participantActionEvent(eventType, conversation, userActionCreator, userActioned) {
    const userActionedDisplayName = this.helpers.getDisplayName(userActioned)
    const text = CONVERSATION_EVENTS.ACTION_PARTICIPANT_MESSAGE[eventType]
    const createMessageParams = {
      cid: conversation._id,
      body: `${userActionedDisplayName} ${text}`,
      x: { type: eventType, user: userActioned.visibleParams() },
    }

    const createdMessage = await this.messageService.create(userActionCreator, conversation, [], createMessageParams)

    const userActionCreatorDisplayName = this.helpers.getDisplayName(userActionCreator)
    const pushPayload = {
      title: `${userActionCreatorDisplayName} | ${conversation.name}`,
      body: createdMessage.body,
      cid: createdMessage.cid,
    }

    const eventMessage = new MessageResponse(new MessagePublicFields(createdMessage))

    const eventNotification = new CreatePushEventOptions(userActionCreator._id, pushPayload, {})

    return { message: eventMessage, notification: eventNotification }
  }
}

export default ConversationNotificationService
