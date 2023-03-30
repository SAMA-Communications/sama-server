import BaseRepository from "./base.js";
import Contact from "../models/contact.js";
import User from "../models/user.js";

export default class ContactsMatchRepository extends BaseRepository {
  constructor() {
    super(null, null);
  }

  async matchUserWithContact(userFields, option) {
    const records = [];
    const fields = Object.keys(option);

    let [tmpRecords, timeParam] = [[], null];
    do {
      const filedsArray = [];
      for (const field of fields) {
        option[field].oldValue &&
          filedsArray.push({ [`${field}.value`]: option[field].oldValue });
        filedsArray.push({ [`${field}.value`]: userFields[field] });
      }

      const query = { $or: filedsArray };
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
      const uId = userFields._id.toString();
      const updateParam = {};

      for (const field of fields) {
        if (!r[field]) {
          continue;
        }

        const o = option[field];
        switch (true) {
          case !!o.removeRecord:
            updateParam[field] = r[field].map((el) => {
              el.value === userFields[field] && delete el["matched_user_id"];
              return el;
            });
            break;
          case !!o.replaceRecord:
            updateParam[field] = r[field].map((el) => {
              el.value === o.oldValue && delete el["matched_user_id"];
              return el;
            });
          case !!o.addRecord:
            updateParam[field] = r[field].map((el) => {
              if (el.value === userFields[field]) {
                el["matched_user_id"] = uId;
              }
              return el;
            });
            break;
        }
      }

      await Contact.updateOne({ _id: r._id.toString() }, { $set: updateParam });
    }
  }

  async matchedUser(userFields, option) {
    const field = option.field;
    const userField = userFields[field];
    userFields[field] = [];

    const findedUsersList = await User.findAll(
      { [field]: { $in: userField.map((el) => el.value) } },
      ["_id", field]
    );

    const findedUsersObj = {};
    for (let obj of findedUsersList) {
      findedUsersObj[obj[field]] = obj._id;
    }

    for (let obj of userField) {
      if (findedUsersObj[obj.value]) {
        obj["matched_user_id"] = findedUsersObj[obj.value];
      }

      userFields[field].push(obj);
    }
  }
}
