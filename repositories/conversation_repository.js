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

  static async update(_id) {
    if (!_id) {
      return "Invalid key";
    }

    const conv = await Conversation.findOne({ _id: _id });
    if (conv) {
      inMemoryConversations[_id] = conv.params;
    } else if (inMemoryConversations[_id]) {
      delete inMemoryConversations[_id];
    }
  }

  static async delete(_id) {
    if (!_id) {
      return "Invalid key";
    }

    inMemoryConversations[_id] && delete inMemoryConversations[_id];
  }

  async findById(_id) {
    let conv = this.inMemoryStorage[_id];

    if (!conv) {
      conv = await Conversation.findOne({ _id });
      this.inMemoryStorage[_id] = conv;
    }

    return conv;
  }
}
