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

  async upsert(blocked_user_id, user_id, value) {
    if (!blocked_user_id) {
      throw "Invalid key";
    }

    if (!value) {
      this.inMemoryStorage[blocked_user_id][user_id] &&
        delete this.inMemoryStorage[blocked_user_id][user_id];
      return;
    } else if (!this.inMemoryStorage[blocked_user_id]) {
      this.inMemoryStorage[blocked_user_id] = {};
    }

    const blockedUser = new BlockedUser({
      user_id: currentUserId,
      blocked_user_id: uId,
    });
    await blockedUser.save();

    this.inMemoryStorage[blocked_user_id][user_id] = true;
  }

  async delete(blocked_user_id, user_id) {
    if (!user_id) {
      throw "Invalid key";
    }

    const record = await BlockedUser.findOne({
      blocked_user_id,
      user_id,
    });

    if (record) {
      await record.delete();
    }

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

  async findOne(blocked_user_id, user_id) {
    return await BlockedUser.findOne(user_id, blocked_user_id);
  }
}
