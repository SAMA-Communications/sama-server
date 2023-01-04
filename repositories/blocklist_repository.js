import BaseRepository from "./base.js";
import BlockedUser from "../models/blocked_user.js";

export default class BlockListRepository extends BaseRepository {
  constructor(model, inMemoryStorage) {
    super(model, inMemoryStorage);
  }

  async findAll(params, fileds, limit) {
    const storeKey = JSON.stringify(params);
    let users = this.inMemoryStorage[storeKey];

    if (!users) {
      users = await BlockedUser.findAll(params, fileds, limit);
      this.inMemoryStorage[storeKey] = users;
    }

    return users;
  }
}
