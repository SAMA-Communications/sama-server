import BaseRepository from './base.js'
import Conversation from '../models/conversation.js'
import { inMemoryConversations } from '../store/in_memory.js'

export default class ConversationRepository extends BaseRepository {
  constructor(model, inMemoryStorage) {
    super(model, inMemoryStorage)
  }

  static async warmCache() {
    const db_Conversation = await Conversation.findAll(
      {},
      null,
      process.env.CONVERSATION_PRELOAD_COUNT,
      {
        updated_at: -1,
      }
    )

    db_Conversation.forEach((conv) => {
      inMemoryConversations[conv._id] = conv
    })

    console.log('[Cache] Conversation cache upload success')
  }

  async updateOne(_id, value) {
    if (!_id) {
      throw 'Invalid key'
    }

    const conv = (await Conversation.findOneAndUpdate({ _id }, { $set: value }))
      ?.value

    if (conv) {
      this.inMemoryStorage[_id] = conv.params
    } else {
      delete this.inMemoryStorage[_id]
    }
  }

  async delete(convId) {
    if (!convId) {
      throw 'Invalid param'
    }

    const conv = this.inMemoryStorage[convId]
    delete this.inMemoryStorage[convId]
    await new Conversation(conv).delete()
  }

  async findById(_id) {
    let conv = this.inMemoryStorage[_id]

    if (!conv) {
      conv = (await Conversation.findOne({ _id }))?.params
      this.inMemoryStorage[_id] = conv
    }

    return conv
  }

  async findOne(params) {
    const conv = (await Conversation.findOne(params))?.params
    if (conv) {
      this.inMemoryStorage[conv._id.toString()] = conv
    }

    return conv
  }

  async findAll(params, fields, limit, sortParams) {
    const list = await Conversation.findAll(params, fields, limit, sortParams)
    list.forEach(
      (record) => (this.inMemoryStorage[record._id.toString()] = record)
    )

    return list
  }
}
