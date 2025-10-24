import { ERROR_STATUES } from "../../../../constants/errors.js"

class ContactEditOperation {
  constructor(sessionService, contactService) {
    this.sessionService = sessionService
    this.contactService = contactService
  }

  async perform(ws, contactUpdate) {
    const { userId: currentUserId, organizationId } = this.sessionService.getSession(ws)

    const contactId = contactUpdate.id
    delete contactUpdate["id"]

    await this.contactService.matchContactWithUser(organizationId, contactUpdate)

    const updatedContact = await this.contactService.findByIdAndUpdate(currentUserId, contactId, contactUpdate)

    if (!updatedContact) {
      throw new Error(ERROR_STATUES.CONTACT_NOT_FOUND.message, {
        cause: ERROR_STATUES.CONTACT_NOT_FOUND,
      })
    }

    return updatedContact
  }
}

export default ContactEditOperation
