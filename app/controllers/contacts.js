import BaseController from "./base/base.js";
import Contact from "./../models/contact.js";
import ContactsMatchRepository from "../repositories/contact_match_repository.js";
import SessionRepository from "./../repositories/session_repository.js";
import { ACTIVE } from "./../store/session.js";
import { ERROR_STATUES } from "./../validations/constants/errors.js";
import { ObjectId } from "mongodb";

class ContactsController extends BaseController {
  constructor() {
    super();

    this.sessionRepository = new SessionRepository(ACTIVE);
    this.contactMatchRepository = new ContactsMatchRepository();
  }

  async contact_add(ws, data) {
    const { id: requestId, contact_add: contactData } = data;
    const currentUser = this.sessionRepository.getSessionUserId(ws);

    const matchOption = { fields: [] };
    contactData.email && matchOption.fields.push("email");
    contactData.phone && matchOption.fields.push("phone");

    matchOption.fields.length &&
      (await this.contactMatchRepository.matchedUser(contactData, matchOption));
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
    for (let u of contacts) {
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

    const matchOption = { fields: [] };
    updatedData.email && matchOption.fields.push("email");
    updatedData.phone && matchOption.fields.push("phone");

    matchOption.fields.length &&
      (await this.contactMatchRepository.matchedUser(updatedData, matchOption));

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

    const userId = this.sessionRepository.getSessionUserId(ws);
    const contact = await Contact.findOne({ _id: id, user_id: userId });
    contact && (await contact.delete());

    return { response: { id: requestId, success: true } };
  }
}

export default new ContactsController();
