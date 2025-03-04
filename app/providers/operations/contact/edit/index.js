import { ERROR_STATUES } from "../../../../constants/errors.js"

class ContactEditOperation {
  constructor(sessionService, contactService) {
    this.sessionService = sessionService
    this.contactService = contactService
  }

  async perform(ws, contactUpdate) {
    const contactId = contactUpdate.id
    delete contactUpdate["id"]

    await this.contactService.matchContactWithUser(contactUpdate)

    const updatedContact = await this.contactService.findByIdAndUpdate(contactId, contactUpdate)

    if (!updatedContact) {
      throw new Error(ERROR_STATUES.CONTACT_NOT_FOUND.message, {
        cause: ERROR_STATUES.CONTACT_NOT_FOUND,
      })
    }

    return updatedContact
  }
}

export default ContactEditOperation
