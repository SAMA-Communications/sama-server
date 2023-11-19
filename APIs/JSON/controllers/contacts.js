import BaseJSONController from "./base.js";
import Contact from "./../../../app/models/contact.js";
import ContactsMatchRepository from "../../../app/repositories/contact_match_repository.js";
import SessionRepository from "./../../../app/repositories/session_repository.js";
import { ACTIVE } from "./../../../app/store/session.js";
import { ERROR_STATUES } from "./../../../app/validations/constants/errors.js";
import { ObjectId } from "../../../app/lib/db.js";

class ContactsController extends BaseJSONController {
  constructor() {
    super();

    this.sessionRepository = new SessionRepository(ACTIVE);
    this.contactMatchRepository = new ContactsMatchRepository();
  }

  async contact_add(ws, data) {
    const { id: requestId, contact_add: contactData } = data;
    const currentUser = this.sessionRepository.getSessionUserId(ws);

    await this.contactMatchRepository.matchContactWithUser(contactData);
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

    await this.contactMatchRepository.matchContactWithUser(updatedData);

    const updatedResult = await Contact.findOneAndUpdate(
      { _id: recordId },
      { $set: updatedData }
    );

    if (!updatedResult.ok) {
      throw new Error(ERROR_STATUES.CONTACT_NOT_FOUND.message, {
        cause: ERROR_STATUES.CONTACT_NOT_FOUND,
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
      queryParams.updated_at = { $gt: new Date(query.updated_at) };
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
