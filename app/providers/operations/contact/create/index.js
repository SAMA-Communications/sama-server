class ContactAddOperation {
  constructor(sessionService, contactService) {
    this.sessionService = sessionService
    this.contactService = contactService
  }

  async perform(ws, contactData, isBatch) {
    const { userId: currentUserId, organizationId } = this.sessionService.getSession(ws)

    if (!isBatch) {
      return this.singleAdd(organizationId, currentUserId, contactData)
    } else {
      return this.batchAdd(organizationId, currentUserId, contactData)
    }
  }

  async singleAdd(organizationId, currentUserId, contactData) {
    await this.contactService.matchContactWithUser(organizationId, contactData)

    contactData.organization_id = organizationId
    contactData.user_id = currentUserId

    const contact = await this.contactService.create(contactData)

    return contact
  }

  async batchAdd(organizationId, currentUserId, contactsData) {
    const contactsList = []

    for (const contactData of contactsData) {
      if (!contactData.email || !contactData.phone) {
        continue
      }

      const contact = await this.singleAdd(organizationId, currentUserId, contactData)

      contactsList.push(contact)
    }

    return contactsList
  }
}

export default ContactAddOperation
