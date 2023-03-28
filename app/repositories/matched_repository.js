import BaseRepository from "./base.js";
import Contact from "../models/contact.js";
import User from "./../models/user.js";

export default class MatchedRepository extends BaseRepository {
  constructor() {
    super(null, null);
  }

  async matchedContact(data, options) {
    const records = [];
    const field = options.field;

    let [tmpRecords, timeParam] = [[], null];
    do {
      const query = { [`${field}.value`]: data[field] };
      if (timeParam) {
        query["created_at"] = { $gt: timeParam };
      }
      tmpRecords = await Contact.findAll(query);

      if (!tmpRecords.length) {
        return;
      }

      records.push.apply(records, tmpRecords);
      timeParam = tmpRecords[tmpRecords.length - 1].created_at;
    } while (tmpRecords.length === 100);

    if (!records.length) {
      return;
    }

    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      const uId = data._id.toString();
      const updateParam = {};

      function updateArray(field) {
        updateParam[field] = r[field].map((el) => {
          if (el.value === data[field]) {
            options.addRecord
              ? (el["matched_user_id"] = uId)
              : delete el["matched_user_id"];
          }
          return el;
        });
      }

      r[field] && updateArray(field);

      await Contact.updateOne({ _id: r._id.toString() }, { $set: updateParam });
    }
  }

  async matchedUser(data, field) {
    const fieldData = data[field];
    data[field] = [];

    const findedUsersList = await User.findAll(
      { [field]: { $in: fieldData.map((el) => el.value) } },
      ["_id", field]
    );

    const findedUsersObj = {};
    for (let i = 0; i < findedUsersList.length; i++) {
      const obj = findedUsersList[i];
      findedUsersObj[obj[field]] = obj._id;
    }

    for (let i = 0; i < fieldData.length; i++) {
      const obj = fieldData[i];
      if (findedUsersObj[obj.value]) {
        obj["matched_user_id"] = findedUsersObj[obj.value];
      }

      data[field].push(obj);
    }
  }
}
