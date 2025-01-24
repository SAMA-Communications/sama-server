class ContactDeleteOperation {
  constructor(sessionService, contactService) {
    this.sessionService = sessionService
    this.contactService = contactService
  }

  async perform(ws, contactDeleteOptions) {
    const { id } = contactDeleteOptions
    const userId = this.sessionService.getSessionUserId(ws)

    await this.contactService.delete(userId, id)
  }
}

export default ContactDeleteOperation
