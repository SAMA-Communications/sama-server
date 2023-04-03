import BaseRepository from "./base.js";
import Contact from "../models/contact.js";
import User from "../models/user.js";

export default class ContactsMatchRepository extends BaseRepository {
  constructor() {
    super(null, null);
  }

  async matchUserWithContactOnCreate(userId, phone, email) {
    const records = [];
    if (!(email && phone)) {
      return;
    }

    let [tmpRecords, timeParam] = [[], null];
    do {
      const filedsArray = [];
      phone && filedsArray.push({ [`phone.value`]: phone });
      email && filedsArray.push({ [`email.value`]: email });

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
      const updateParam = {};

      if (!(r.email && r.phone)) {
        continue;
      }

      if (email) {
        updateParam["email"] = r.email.map((el) => {
          if (el.value === email) {
            el["matched_user_id"] = userId;
          }
          return el;
        });
      }

      if (phone) {
        updateParam["phone"] = r.phone.map((el) => {
          if (el.value === phone) {
            el["matched_user_id"] = userId;
          }
          return el;
        });
      }

      await Contact.updateOne({ _id: r._id.toString() }, { $set: updateParam });
    }
  }

  async matchUserWithContactOnUpdate(userId, phone, email, oldPhone, oldEmail) {
    const records = [];
    if (!((email && oldEmail) || (phone && oldPhone))) {
      return;
    }

    let [tmpRecords, timeParam] = [[], null];
    do {
      const filedsArray = [];
      phone &&
        filedsArray.push(
          { [`phone.value`]: phone },
          { [`phone.value`]: oldPhone }
        );
      email &&
        filedsArray.push(
          { [`email.value`]: email },
          { [`email.value`]: oldEmail }
        );

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
      const updateParam = {};

      if (!(r.email && r.phone)) {
        continue;
      }

      if (email) {
        updateParam["email"] = r.email.map((el) => {
          if (el.value === oldEmail) {
            el.value = email;
          }
          if (el.value === email) {
            el["matched_user_id"] = userId;
          }
          return el;
        });
      }

      if (phone) {
        updateParam["phone"] = r.phone.map((el) => {
          if (el.value === oldPhone) {
            el.value = phone;
          }
          if (el.value === phone) {
            el["matched_user_id"] = userId;
          }
          return el;
        });
      }

      await Contact.updateOne({ _id: r._id.toString() }, { $set: updateParam });
    }
  }

  async matchUserWithContactOnDelete(userId, phone, email) {
    const records = [];
    if (!(email && phone)) {
      return;
    }

    let [tmpRecords, timeParam] = [[], null];
    do {
      const filedsArray = [];
      phone && filedsArray.push({ [`phone.value`]: phone });
      email && filedsArray.push({ [`email.value`]: email });

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
      const updateParam = {};

      if (!(r.email && r.phone)) {
        continue;
      }

      if (email) {
        updateParam["email"] = r.email.map((el) => {
          if (el.value === email) {
            delete el["matched_user_id"];
          }
          return el;
        });
      }

      if (phone) {
        updateParam["phone"] = r.phone.map((el) => {
          if (el.value === phone) {
            delete el["matched_user_id"];
          }
          return el;
        });
      }

      await Contact.updateOne({ _id: r._id.toString() }, { $set: updateParam });
    }
  }

  async matchContactWithUserOnCreate(userData) {
    const { phone, email } = userData;

    const query = { $or: [] };
    const visibleFields = ["_id"];
    if (email) {
      userData["email"] = [];
      query["$or"].push({ email: { $in: email.map((el) => el.value) } });
      visibleFields.push("email");
    }
    if (phone) {
      userData["phone"] = [];
      query["$or"].push({ phone: { $in: phone.map((el) => el.value) } });
      visibleFields.push("phone");
    }
    const findedUsersList = await User.findAll(query, visibleFields);

    for (let i = 1; i < visibleFields.length; i++) {
      const field = visibleFields[i];
      const findedUsersObj = {};
      for (let obj of findedUsersList) {
        findedUsersObj[obj[field]] = obj._id;
      }

      for (let obj of userData[field]) {
        if (findedUsersObj[obj.value]) {
          obj["matched_user_id"] = findedUsersObj[obj.value];
        }

        userData[field].push(obj);
      }
    }
  }

  async matchedContactWithUser(userData) {
    const fields = [];
    userData.email && fields.push("email");
    userData.phone && fields.push("phone");

    if (!fields.length) {
      return;
    }

    const findedUsersList = await User.findAll(
      {
        $or: fields.map((field) => {
          return { [field]: { $in: userData[field].map((el) => el.value) } };
        }),
      },
      ["_id", ...fields]
    );

    for (const field of fields) {
      const userField = userData[field];
      userData[field] = [];

      const findedUsersObj = {};
      for (let obj of findedUsersList) {
        findedUsersObj[obj[field]] = obj._id;
      }

      for (let obj of userField) {
        if (findedUsersObj[obj.value]) {
          obj["matched_user_id"] = findedUsersObj[obj.value];
        }

        userData[field].push(obj);
      }
    }
  }
}
