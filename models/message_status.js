import BaseModel from "./base/base.js";

export default class MessageStatus extends BaseModel {
  constructor(params) {
    super(params);
  }

  static get collection() {
    return "message_status";
  }

  static get visibleFields() {
    return ["_id", "cid", "mid", "user_id", "created_at", "status"];
  }

  static async getReadStatusForMids(mids) {
    const $match = {
      mid: { $in: mids },
    };
    const $group = {
      _id: "$mid",
      users: { $push: "$user_id" },
    };
    const aggregatedResult = await this.aggregate([{ $match }, { $group }]);
    const result = {};
    aggregatedResult.forEach((obj) => {
      result[obj._id] = [...new Set(obj.users)];
    });
    return result;
  }
}
