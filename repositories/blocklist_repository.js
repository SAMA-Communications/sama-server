import BaseRepository from "./base.js";
import BlockedUser from "../models/blocked_user.js";
import { inMemoryBlockList } from "../store/in_memory.js";

export default class BlockListRepository extends BaseRepository {
  constructor(model, inMemoryStorage) {
    super(model, inMemoryStorage);
  }

  static async warmCache() {
    const $match = {};
    const $group = {
      _id: "$blocked_user_id",
      users: { $push: "$user_id" },
    };

    const db_BlockedUser = await BlockedUser.aggregate([
      { $match },
      { $group },
    ]);

    db_BlockedUser.forEach((obj) => {
      inMemoryBlockList[obj._id?.toString()] = obj.users.reduce(
        (arr, field) => ({ ...arr, [field]: true }),
        {}
      );
    });

    console.log("[Cache] BlockList cache upload success");
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
