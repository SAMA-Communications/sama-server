import BaseController from "./base/base.js";
import Contact from "./../models/contact.js";
import SessionRepository from "./../repositories/session_repository.js";
import User from "./../models/user.js";
import { ACTIVE } from "./../store/session.js";
import { ERROR_STATUES } from "./../validations/constants/errors.js";
import { ObjectId } from "mongodb";

class ContactsController extends BaseController {
  constructor() {
    super();

    this.sessionRepository = new SessionRepository(ACTIVE);
  }

  async #matched(data) {
    async function matchedLogic(field, data) {
      data[field] = [];
      const findedUsersList = await User.findAll(
        { [field]: { $in: data.map((el) => el.value) } },
        ["_id", field]
      );

      const findedUsersObj = {};
      for (let i = 0; i < findedUsersList.length; i++) {
        const obj = findedUsersList[i];
        findedUsersObj[obj[field]] = obj._id;
      }

      for (let i = 0; i < data.length; i++) {
        const obj = data[i];
        if (findedUsersObj[obj.value]) {
          obj["matched_user_id"] = findedUsersObj[obj.value];
        }

        data[field].push(obj);
      }
    }

    data.email && (await matchedLogic("email", data.email));
    data.phone && (await matchedLogic("phone", data.phone));
  }

  async contact_add(ws, data) {
    const { id: requestId, contact_add: contactData } = data;
    const currentUser = this.sessionRepository.getSessionUserId(ws);

    await this.#matched(contactData);
    contactData.user_id = ObjectId(currentUser);

    const contact = new Contact(contactData);
    await contact.save();

    return { response: { id: requestId, contact: contact.visibleParams() } };
  }

  async contact_batch_add(ws, data) {
    const {
      id: requestId,
      contact_batch_add: { contacts },
    } = data;

    const contactsList = [];
    for (let i = 0; i < contacts.length; i++) {
      const u = contacts[i];

      if (!u.email || !u.phone) {
        continue;
      }

      const contact = (
        await this.contact_add(ws, { contact_add: u, id: "contact_batch_add" })
      ).response.contact;
      contactsList.push(contact);
    }

    return { response: { id: requestId, contacts: contactsList } };
  }

  async contact_update(ws, data) {
    const { id: requestId, contact_update: updatedData } = data;
    const recordId = updatedData.id;

    delete updatedData["id"];
    await this.#matched(updatedData);

    const updatedResult = await Contact.findOneAndUpdate(
      { _id: recordId },
      { $set: updatedData }
    );

    if (!updatedResult) {
      throw new Error(ERROR_STATUES.USER_NOT_FOUND.message, {
        cause: ERROR_STATUES.USER_NOT_FOUND,
      });
    }

    return {
      response: { id: requestId, contact: updatedResult.value },
    };
  }

  async contact_list(ws, data) {
    const { id: requestId, contact_list: query } = data;
    const currentUser = this.sessionRepository.getSessionUserId(ws).toString();

    const queryParams = { user_id: currentUser.toString() };
    if (query.updated_at) {
      queryParams.updated_at = { $gt: query.updated_at };
    }

    const contacts = await Contact.findAll(queryParams, null, query.limit);

    return { response: { id: requestId, contacts } };
  }

  async contact_delete(ws, data) {
    const {
      id: requestId,
      contact_delete: { id },
    } = data;

    const contact = await Contact.findOne({ _id: id });
    contact && (await contact.delete());

    return { response: { id: requestId, success: true } };
  }
}

export default new ContactsController();
