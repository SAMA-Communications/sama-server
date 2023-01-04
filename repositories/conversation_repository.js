import BaseRepository from "./base.js";
import Conversation from "../models/conversation.js";
import { inMemoryConversations } from "../store/in_memory.js";

export default class ConversationRepository extends BaseRepository {
  constructor(model, inMemoryStorage) {
    super(model, inMemoryStorage);
  }

  static async findOne(_id) {
    let conv = inMemoryConversations[_id];

    if (!conv) {
      conv = await Conversation.findOne({ _id });
      inMemoryConversations[_id] = conv;
    }

    return conv;
  }
}
