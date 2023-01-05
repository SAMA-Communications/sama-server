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

  static async upsert(blocked_user_id, user_id, value) {
    if (!blocked_user_id) {
      return "Invalid key";
    }

    if (!value) {
      inMemoryBlockList[blocked_user_id][user_id] &&
        delete inMemoryBlockList[blocked_user_id][user_id];
      return;
    } else if (!inMemoryBlockList[blocked_user_id]) {
      inMemoryBlockList[blocked_user_id] = {};
    }

    inMemoryBlockList[blocked_user_id][user_id] = true;
  }

  static async delete(user_id) {
    inMemoryBlockList[user_id] && delete inMemoryBlockList[user_id];

    for (const uId in inMemoryBlockList) {
      inMemoryBlockList[uId][user_id] && delete inMemoryBlockList[uId][user_id];
    }
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
