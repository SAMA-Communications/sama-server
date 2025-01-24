class ContactAddOperation {
  constructor(sessionService, contactService) {
    this.sessionService = sessionService
    this.contactService = contactService
  }

  async perform(ws, contactData, isBatch) {
    const currentUserId = this.sessionService.getSessionUserId(ws)

    if (!isBatch) {
      return this.singleAdd(currentUserId, contactData)
    } else {
      return this.batchAdd(currentUserId, contactData)
    }
  }

  async singleAdd(currentUserId, contactData) {
    await this.contactService.matchContactWithUser(contactData)
    contactData.user_id = ObjectId(currentUserId)

    const contact = await this.contactService.create(contactData)

    return contact
  }

  async batchAdd(currentUserId, contactsData) {
    const contactsList = []

    for (const contactData of contactsData) {
      if (!contactData.email || !contactData.phone) {
        continue
      }

      const contact = await this.singleAdd(currentUserId, contactData)

      contactsList.push(contact)
    }

    return contactsList
  }
}

export default ContactAddOperation
