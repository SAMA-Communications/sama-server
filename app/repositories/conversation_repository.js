import BaseRepository from './base.js'

import Conversation from '../models/conversation.js'

import { inMemoryConversations } from '../store/in_memory.js'

class ConversationRepository extends BaseRepository {
  constructor(ConversationModel, inMemoryStorage) {
    super(ConversationModel)

    this.inMemoryStorage = inMemoryStorage
  }

  async warmCache() {
    const dbConversation = await this.Model.findAll(
      {},
      null,
      process.env.CONVERSATION_PRELOAD_COUNT,
      {
        updated_at: -1,
      }
    )

    dbConversation.forEach((conv) => {
      inMemoryConversations[conv._id] = conv
    })

    console.log('[Cache] Conversation cache upload success')
  }

  async updateOne(_id, value) {
    const conv = (await this.Model.findOneAndUpdate({ _id }, { $set: value }))
      ?.value

    if (conv) {
      this.inMemoryStorage[_id] = conv.params
    } else {
      delete this.inMemoryStorage[_id]
    }
  }

  async delete(convId) {
    const conv = this.inMemoryStorage[convId]

    delete this.inMemoryStorage[convId]

    await new this.Model(conv).delete()
  }

  async findById(_id) {
    let conv = this.inMemoryStorage[_id]

    if (!conv) {
      conv = (await this.Model.findOne({ _id }))?.params
      this.inMemoryStorage[_id] = conv
    }

    return conv
  }

  async findOne(params) {
    const conv = (await this.Model.findOne(params))?.params

    if (conv) {
      this.inMemoryStorage[conv._id.toString()] = conv
    }

    return conv
  }

  async findAll(params, fields, limit, sortParams) {
    const list = await this.Model.findAll(params, fields, limit, sortParams)

    list.forEach(
      (record) => (this.inMemoryStorage[record._id.toString()] = record)
    )

    return list
  }
}

export default new ConversationRepository(Conversation, inMemoryConversations)
