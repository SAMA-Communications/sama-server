import BaseRepository from "./base.js";
import Conversation from "../models/conversation.js";
import { inMemoryConversations } from "../store/in_memory.js";

export default class ConversationRepository extends BaseRepository {
  constructor(model, inMemoryStorage) {
    super(model, inMemoryStorage);
  }

  static async warmCache() {
    const db_Conversation = await Conversation.findAll({}, null, null, {
      updated_at: -1,
    });

    db_Conversation.forEach((conv) => {
      inMemoryConversations[conv._id] = conv;
    });

    console.log("[Cache] Conversation cache upload success");
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
