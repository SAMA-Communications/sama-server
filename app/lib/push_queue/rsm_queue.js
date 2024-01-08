import RSMQPromise from 'rsmq-promise'

import BasePushQueue from './base.js'

export default class RSMPushQueue extends BasePushQueue {
  constructor(redisClient, { chatAlertQueueName, pushQueueName }) {
    super()

    this.chatAlertQueueName = chatAlertQueueName
    this.pushQueueName = pushQueueName

    this.rsmq = new RSMQPromise({ client: redisClient })
  }

  async createQueueIfNoExists(createQueueName) {
    const queueLists = await this.rsmq.listQueues()
    const existedQueue = queueLists.find(qname => qname === createQueueName)

    if (existedQueue) {
      return
    }

    await this.rsmq.createQueue({ qname: createQueueName })
  }

  async createChatAlert(createChatAlertEventOptions) {
    await this.createQueueIfNoExists(this.chatAlertQueueName)

    const messagePayload = {
      dialogId: createChatAlertEventOptions.dialogId,
      messageId: createChatAlertEventOptions.messageId,
      senderID: createChatAlertEventOptions.senderID,
      offlineUsersIDs: createChatAlertEventOptions.offlineUsersIDs
    }

    await this.addToQueue(this.chatAlertQueueName, [JSON.stringify(messagePayload)])
  }

  async createPushEvents(createPushEventOptions) {
    await this.createQueueIfNoExists(this.pushQueueName)

    const pushEvents = await this.buildPushEvents(createPushEventOptions)

    const pushEventIds = pushEvents.map(pushEvent => pushEvent.params._id.toString())

    await this.addToQueue(this.pushQueueName, pushEventIds)

    return pushEvents
  }

  async addToQueue(qName, payloads) {
    for (const payload of payloads) {
      await this.rsmq.sendMessage({ qname: qName, message: payload })
    }
  }
}
