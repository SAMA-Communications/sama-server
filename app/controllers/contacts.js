import BaseController from "./base/base.js";
import Contact from "./../models/contact.js";
import User from "./../models/user.js";
import { ERROR_STATUES } from "../validations/constants/errors.js";

class ContactsController extends BaseController {
  constructor() {
    super();
  }

  async contact_add(ws, data) {
    const {
      id: requestId,
      contact_add: { email, phone },
    } = data;

    if (email) {
      for (let i = 0; i < email.length; i++) {
        const value = email[i].value;
        const findedUser = await User.findOne({ email: value });

        if (!findedUser) {
          continue;
        }

        email[i].matched_id = findedUser._id;
      }
    }

    if (phone) {
      for (let i = 0; i < phone.length; i++) {
        const value = phone[i].value;
        const findedUser = await User.findOne({ phone: value });

        if (!findedUser) {
          continue;
        }

        phone[i].matched_id = findedUser._id;
      }
    }

    const contact = new Contact(reqData);
    await contact.save();

    return { response: { id: requestId, contact: contact.visibleParams() } };
  }

  async contact_batch_add(ws, data) {
    const {
      id: requestId,
      contact_batch_add: { users },
    } = data;

    const contactsList = [];
    for (let i = 0; i < users.length; i++) {
      const u = users[i];

      if (!u.email || !u.phone) {
        continue;
      }

      const contact = await this.contact_add(u);
      contactsList.push(contact);
    }

    return { response: { id: requestId, contacts: contactsList } };
  }

  async contact_update(ws, data) {
    const {
      id: requestId,
      contact_update: { email, phone },
    } = data;

    return {
      response: { id: requestId, user: updatedContact.visibleParams() },
    };
  }

  async contact_delete(ws, data) {
    const {
      id: requestId,
      contact_delete: { email, phone },
    } = data;

    return { response: { id: requestId, success: true } };
  }

  async contact_list(ws, data) {}
}

export default new ContactsController();
