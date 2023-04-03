import BaseRepository from "./base.js";
import Contact from "../models/contact.js";
import User from "../models/user.js";

export default class ContactsMatchRepository extends BaseRepository {
  constructor() {
    super(null, null);
  }

  async #getRecords(store, query) {
    if (!query?.$or?.length) {
      return;
    }

    let [tmpRecords, timeParam] = [[], null];
    do {
      if (timeParam) {
        query["created_at"] = { $gt: timeParam };
      }
      tmpRecords = await Contact.findAll(query);

      if (!tmpRecords.length) {
        return;
      }

      store.push.apply(store, tmpRecords);
      timeParam = tmpRecords[tmpRecords.length - 1].created_at;
    } while (tmpRecords.length === 100);
  }

  async #updateFieldOnCreate(data, userId, value) {
    return data.map((el) => {
      if (el.value === value) {
        el["matched_user_id"] = userId;
      }
      return el;
    });
  }

  async matchUserWithContactOnCreate(userId, phone, email) {
    if (!(email && phone)) {
      return;
    }
    const records = [];
    const query = { $or: [] };
    phone && query.$or.push({ [`phone.value`]: phone });
    email && query.$or.push({ [`email.value`]: email });

    await this.#getRecords(records, query);
    if (!records.length) {
      return;
    }

    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      const updateParam = {};

      if (!(r.email && r.phone)) {
        continue;
      }

      email &&
        (updateParam["email"] = await this.#updateFieldOnCreate(
          r.email,
          userId,
          email
        ));
      phone &&
        (updateParam["phone"] = await this.#updateFieldOnCreate(
          r.phone,
          userId,
          phone
        ));

      await Contact.updateOne({ _id: r._id.toString() }, { $set: updateParam });
    }
  }

  async #updateFieldOnUpdate(data, userId, value, oldValue) {
    return data.map((el) => {
      if (el.value === oldValue) {
        el.value = value;
      }
      if (el.value === value) {
        el["matched_user_id"] = userId;
      }
      return el;
    });
  }

  async matchUserWithContactOnUpdate(userId, phone, email, oldPhone, oldEmail) {
    if (!((email && oldEmail) || (phone && oldPhone))) {
      return;
    }
    const records = [];
    const query = { $or: [] };
    phone &&
      query.$or.push({ [`phone.value`]: phone }, { [`phone.value`]: oldPhone });
    email &&
      query.$or.push({ [`email.value`]: email }, { [`email.value`]: oldEmail });

    await this.#getRecords(records, query);
    if (!records.length) {
      return;
    }

    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      const updateParam = {};

      if (!(r.email && r.phone)) {
        continue;
      }

      email &&
        (updateParam["email"] = await this.#updateFieldOnUpdate(
          r.email,
          userId,
          email,
          oldEmail
        ));
      phone &&
        (updateParam["phone"] = await this.#updateFieldOnUpdate(
          r.phone,
          userId,
          phone,
          oldPhone
        ));

      await Contact.updateOne({ _id: r._id.toString() }, { $set: updateParam });
    }
  }

  async #updateFieldOnDelete(data, value) {
    return data.map((el) => {
      if (el.value === value) {
        delete el["matched_user_id"];
      }
      return el;
    });
  }

  async matchUserWithContactOnDelete(userId, phone, email) {
    if (!(email && phone)) {
      return;
    }
    const records = [];
    const query = { $or: [] };
    phone && query.$or.push({ [`phone.value`]: phone });
    email && query.$or.push({ [`email.value`]: email });

    await this.#getRecords(records, query);
    if (!records.length) {
      return;
    }

    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      const updateParam = {};

      if (!(r.email && r.phone)) {
        continue;
      }

      email &&
        (updateParam["email"] = await this.#updateFieldOnDelete(
          r.email,
          email
        ));
      phone &&
        (updateParam["phone"] = await this.#updateFieldOnDelete(
          r.phone,
          phone
        ));

      await Contact.updateOne({ _id: r._id.toString() }, { $set: updateParam });
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
      const findedUsersObj = {};
      for (let obj of findedUsersList) {
        findedUsersObj[obj[field]] = obj._id;
      }

      userData[field] = userData[field].map((obj) => {
        if (findedUsersObj[obj.value]) {
          obj["matched_user_id"] = findedUsersObj[obj.value];
        }
        return obj;
      });
    }
  }
}
