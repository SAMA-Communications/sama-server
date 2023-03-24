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

  async contact_add(ws, data) {
    const {
      id: requestId,
      contact_add: { email, phone },
    } = data;
    const currentUser = this.sessionRepository.getSessionUserId(ws);
    const contactData = data.contact_add;

    if (email) {
      contactData.email = [];
      const findedUsersList = await User.findAll(
        { email: { $in: email.map((el) => el.value) } },
        ["_id", "email"]
      );

      const findedUsersObj = {};
      for (let i = 0; i < findedUsersList.length; i++) {
        const obj = findedUsersList[i];
        findedUsersObj[obj.email] = obj._id;
      }

      for (let i = 0; i < email.length; i++) {
        const obj = email[i];
        if (findedUsersObj[obj.value]) {
          obj["matched_user_id"] = findedUsersObj[obj.value];
        }

        contactData.email.push(obj);
      }
    }

    if (phone) {
      contactData.phone = [];
      const findedUsersList = await User.findAll(
        { phone: { $in: phone.map((el) => el.value) } },
        ["_id", "phone"]
      );

      const findedUsersObj = {};
      for (let i = 0; i < findedUsersList.length; i++) {
        const obj = findedUsersList[i];
        findedUsersObj[obj.phone] = obj._id;
      }

      for (let i = 0; i < phone.length; i++) {
        const obj = phone[i];
        if (findedUsersObj[obj.value]) {
          obj["matched_user_id"] = findedUsersObj[obj.value];
        }

        contactData.phone.push(obj);
      }
    }

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
    const email = updatedData.email;
    const phone = updatedData.phone;

    const contact = await Contact.findOne({ _id: recordId });
    if (!contact) {
      throw new Error(ERROR_STATUES.USER_NOT_FOUND.message, {
        cause: ERROR_STATUES.USER_NOT_FOUND,
      });
    }
    delete updatedData["id"];

    if (email) {
      updatedData.email = [];
      const findedUsersList = await User.findAll(
        { email: { $in: email.map((el) => el.value) } },
        ["id", "email"]
      );

      const findedUsersObj = {};
      for (let i = 0; i < findedUsersList.length; i++) {
        const obj = findedUsersList[i];
        findedUsersObj[obj.email] = obj._id;
      }

      for (let i = 0; i < email.length; i++) {
        const obj = email[i];
        if (findedUsersObj[obj.value]) {
          obj["matched_user_id"] = findedUsersObj[obj.value];
        }

        updatedData.email.push(obj);
      }
    }

    if (phone) {
      updatedData.phone = [];
      const findedUsersList = await User.findAll(
        { phone: { $in: phone.map((el) => el.value) } },
        ["_id", "phone"]
      );

      const findedUsersObj = {};
      for (let i = 0; i < findedUsersList.length; i++) {
        const obj = findedUsersList[i];
        findedUsersObj[obj.phone] = obj._id;
      }

      for (let i = 0; i < phone.length; i++) {
        const obj = phone[i];
        if (findedUsersObj[obj.value]) {
          obj["matched_user_id"] = findedUsersObj[obj.value];
        }

        updatedData.phone.push(obj);
      }
    }

    await Contact.updateOne({ _id: recordId }, { $set: updatedData });
    const updatedContact = await Contact.findOne({ _id: recordId });

    return {
      response: { id: requestId, contact: updatedContact.visibleParams() },
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
