class ContactListOperation {
  constructor(sessionService, contactService) {
    this.sessionService = sessionService
    this.contactService = contactService
  }

  async perform(ws, options) {
    const { userId: currentUserId, organizationId } = this.sessionService.getSession(ws)

    const { limit, ...queryParams } = options

    const contacts = await this.contactService.list(currentUserId, queryParams, limit)

    return contacts
  }
}

export default ContactListOperation
