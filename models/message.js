import BaseModel from "./base/base.js";
import MessageStatus from "./message_status.js";

export default class Messages extends BaseModel {
  constructor(params) {
    super(params);
  }

  static get collection() {
    return "messages";
  }

  static get visibleFields() {
    return ["_id", "t", "to", "from", "body", "cid", "x"];
  }

  static async getLastMessageForConversation(cids, uId) {
    const $match = {
      cid: { $in: cids },
      deleted_for: { $nin: [uId] },
    };

    const $sort = { t: -1 };
    const $group = {
      _id: "$cid",
      last_message: { $first: "$$ROOT" },
    };
    const $project = { _id: 1, body: 1, from: 1, t: 1, cid: 1 };
    const aggregatedResult = await this.aggregate([
      { $match },
      { $project },
      { $sort },
      { $group },
    ]);

    const result = {};
    const messageStatus = await MessageStatus.getReadStatusForMids(
      aggregatedResult.map((msg) => msg.last_message._id)
    );
    aggregatedResult.forEach((obj) => {
      const msg = obj.last_message;
      msg["read"] = messageStatus[msg._id.toString()] ? true : false;
      msg["status"] = "sent";
      delete msg["cid"];
      result[obj._id] = msg;
    });
    return result;
  }
}
