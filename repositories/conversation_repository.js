import BaseRepository from "./base.js";
import Conversation from "../models/conversation.js";
import { inMemoryConversations } from "../store/in_memory.js";

export default class ConversationRepository extends BaseRepository {
  constructor(model, inMemoryStorage) {
    super(model, inMemoryStorage);
  }

  static async warmCache() {
    const db_Conversation = await Conversation.findAll({}, null, 1000, {
      updated_at: -1,
    });

    db_Conversation.forEach((conv) => {
      inMemoryConversations[conv._id] = conv;
    });

    console.log("[Cache] Conversation cache upload success");
  }

  async updateOne(_id, value) {
    if (!_id) {
      throw "Invalid key";
    }

    await Conversation.updateOne({ _id }, { $set: value });
    const conv = await Conversation.findOne({ _id });

    if (conv) {
      inMemoryConversations[_id] = conv.params;
    } else if (inMemoryConversations[_id]) {
      delete inMemoryConversations[_id];
    }
  }

  async delete(conv) {
    if (!conv) {
      throw "Invalid param";
    }
    console.log(conv);
    inMemoryConversations[conv.params._id] &&
      delete inMemoryConversations[conv.params._id];
    await conv.delete();
  }

  async findById(_id) {
    let conv = this.inMemoryStorage[_id];

    if (!conv) {
      conv = await Conversation.findOne({ _id });
      this.inMemoryStorage[_id] = conv;
    }

    return conv;
  }

  async findOne(params) {
    return await Conversation.findOne(params);
  }

  async findAll(params, fields, limit, sortParams) {
    const list = await Conversation.findAll(params, fields, limit, sortParams);
    list.forEach(
      (record) => (this.inMemoryStorage[record._id.toString()] = record)
    );

    return list;
  }
}
