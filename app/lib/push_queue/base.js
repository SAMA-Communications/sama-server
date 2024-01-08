import pushNotificationsRepository from '../../repositories/push_notifications_repository.js'

import CreateChatAlertEventOptions from './models/CreateChatAlertEventOptions.js'
import CreatePushEventOptions from './models/CreatePushEventOptions.js'

export default class BasePushQueue {
  async buildPushEvents(createPushEventOptions) {
    const pushEvents = await pushNotificationsRepository.createPushEvents(
      createPushEventOptions.user_id,
      createPushEventOptions.user_ids,
      createPushEventOptions.payload,
      {
        account_id: createPushEventOptions.account_id,
        application_id: createPushEventOptions.application_id
      }
    )

    return pushEvents
  }

  async createPush(pushQueueMessage) {
    if (pushQueueMessage instanceof CreateChatAlertEventOptions) {
      await this.createChatAlert(pushQueueMessage)
    } else if (pushQueueMessage instanceof CreatePushEventOptions) {
      await this.createPushEvents(pushQueueMessage)
    }

    throw new Error('Unknown push message type')
  }

  async createChatAlert() {
    throw new Error('Not implemented')
  }

  async createPushEvents() {
    throw new Error('Not implemented')
  }
}
