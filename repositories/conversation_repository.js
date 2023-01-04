import BaseRepository from "./base.js";
import Conversation from "../models/conversation.js";

export default class ConversationRepository extends BaseRepository {
  constructor(model, inMemoryStorage) {
    super(model, inMemoryStorage);
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
