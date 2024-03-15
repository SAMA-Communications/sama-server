import { CONVERSATION_EVENTS } from '../../../constants/conversation.js' 
import CreatePushEventOptions from '@sama/lib/push_queue/models/CreatePushEventOptions.js'

class ConversationNotificationService {
  constructor(
    helpers,
    messageService,
  ) {
    this.helpers = helpers
    this.messageService = messageService
  }

  async actionEvent(eventType, conversation, user) {
    const userDisplayName = this.helpers.getDisplayName(user)
    const eventParams = CONVERSATION_EVENTS.EVENT_TYPE_PARAMS[eventType]

    const pushPayload = {
      title: conversation.name,
      body: `${userDisplayName} ${eventParams.push_message_body}`,
    }

    const createSystemMessageParams = {
      id: conversation._id.toString(),
      from: user.native_id.toString(),
      x: { [eventParams.event_request_name]: conversation.visibleParams() }
    }

    const systemMessage = await this.messageService.createSystemMessage(createSystemMessageParams, conversation._id.toString())

    const eventMessage = { system_message: systemMessage.serialize() }
  
    const eventNotification = new CreatePushEventOptions(user.native_id, pushPayload, {})

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

    const eventMessage = { message: createdMessage.visibleParams() }

    const eventNotification = new CreatePushEventOptions(userActionCreator, conversation, pushPayload, {})

    return { message: eventMessage, notification: eventNotification }
  }
}

export default ConversationNotificationService
