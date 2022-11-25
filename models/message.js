import { ObjectId } from "mongodb";
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
      deleted_for: { $nin: [uId] }, //ObjectId!!
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
      delete msg["cid"];
      msg["status"] = messageStatus[msg._id.toString()] ? "read" : "sent";
      result[obj._id] = msg;
    });
    return result;
  }

  static async getCountOfUnredMessagesByCid(cids, uId) {
    //aggregate for messages status, we need the last read record from db
    const lastReadMessageByUserForCids =
      await MessageStatus.getLastReadMessageByUserForCid(cids, uId);

    //aggregate message -> get list of newMessages
    const arrayParams = cids.map((cid) => {
      const query = { cid: ObjectId(cid), from: { $ne: ObjectId(uId) } };
      if (lastReadMessageByUserForCids[cid]) {
        query._id = { $gt: lastReadMessageByUserForCids[cid] };
      }
      return query;
    });
    const $group = {
      _id: "$cid",
      unred_messages: { $push: "$_id" },
    };
    const aggregatedResult = await this.aggregate([
      { $match: { $or: arrayParams } },
      { $group },
    ]);
    const result = {};
    aggregatedResult.forEach((obj) => {
      result[obj._id] = [...new Set(obj.unred_messages)].length;
    });
    return result;
  }
}
