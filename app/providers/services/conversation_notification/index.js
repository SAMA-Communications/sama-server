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
    const text = CONVERSATION_EVENTS.EVENT_TYPE_PARAMS[eventType].push_message_body

    const pushPayload = {
      title: conversation.name,
      body: `${userDisplayName} ${text}`,
    }

    const eventMessage = {
      event: { conversation_created: conversation.visibleParams() },
    }
  
    const eventNotification = new CreatePushEventOptions(user._id, pushPayload, {})

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

    const createdMessage = await this.messageService.create(userActionCreator._id, [], createMessageParams)

    const userActionCreatorDisplayName = this.helpers.getDisplayName(userActionCreator)
    const pushPayload = {
      title: `${userActionCreatorDisplayName} | ${conversation.name}`,
      body: createdMessage.body,
      cid: createdMessage.cid,
    }

    const eventMessage = { message: createdMessage.visibleParams() }

    const eventNotification = new CreatePushEventOptions(userActionCreator._id, pushPayload, {})

    return { message: eventMessage, notification: eventNotification }
  }
}

export default ConversationNotificationService
