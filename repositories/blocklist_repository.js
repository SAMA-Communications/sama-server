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

  async block(blocked_user_id, user_id) {
    if (!blocked_user_id) {
      throw "Invalid key";
    }

    if (!this.inMemoryStorage[blocked_user_id]) {
      this.inMemoryStorage[blocked_user_id] = {};
    }

    const blockedParams = {
      blocked_user_id,
      user_id,
    };
    const isUserBlocked = await BlockedUser.findOne(blockedParams);
    if (!isUserBlocked) {
      const blockedUser = new BlockedUser(blockedParams);
      await blockedUser.save();
    }
    this.inMemoryStorage[blocked_user_id][user_id] = true;
  }

  async unblock(blocked_user_id, user_id) {
    if (!user_id) {
      throw "Invalid key";
    }

    const record = await BlockedUser.findOne({
      blocked_user_id,
      user_id,
    });
    record && (await record.delete());

    this.inMemoryStorage[blocked_user_id] &&
      delete this.inMemoryStorage[blocked_user_id][user_id];
  }

  async delete(user_id) {
    if (!user_id) {
      throw "Invalid key";
    }

    delete this.inMemoryStorage[user_id];

    for (const uId in this.inMemoryStorage) {
      this.inMemoryStorage[uId] && delete this.inMemoryStorage[uId][user_id];
    }

    await BlockedUser.deleteMany({
      $or: [{ blocked_user_id: user_id }, { user_id }],
    });
  }

  async findAll(blocked_user_id, users_filter) {
    const userObject = this.inMemoryStorage[blocked_user_id];

    return userObject
      ? Object.keys(userObject).filter((u) => users_filter.includes(u))
      : [];
  }
}
