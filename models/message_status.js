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

  // static async getMessagesStatusByCid(cids, uId) {
  //   const $match = {
  //     cid: { $in: cids },
  //     user_id: uId,
  //   };
  //   const $group = {
  //     _id: "$cid",
  //     mids: { $push: "$mid" },
  //   };
  //   const aggregateResult = await this.aggregate([{ $match }, { $group }]);
  //   const result = {};
  //   aggregateResult.forEach((obj) => {
  //     result[obj._id] = [...new Set(obj.mids)];
  //   });
  //   return result;
  // }
}
