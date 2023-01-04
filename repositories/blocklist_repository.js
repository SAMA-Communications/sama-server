import BaseRepository from "./base.js";
import { inMemoryBlockList } from "../store/in_memory.js";
import BlockedUser from "../models/blocked_user.js";

export default class BlockListRepository extends BaseRepository {
  constructor(model, inMemoryStorage) {
    super(model, inMemoryStorage);
  }

  static async findAll(params, fileds, limit) {
    let users = inMemoryBlockList[params];
    if (!users) {
      users = await BlockedUser.findAll(params, fileds, limit);
      inMemoryBlockList[params] = users;
    }

    return users;
  }
}
