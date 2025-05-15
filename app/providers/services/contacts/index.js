class ContactService {
  constructor(contactRepo, userRepo) {
    this.contactRepo = contactRepo
    this.userRepo = userRepo
  }

  async create(contactData) {
    const contact = await this.contactRepo.create(contactData)

    return contact
  }

  async delete(ownerId, contactId) {
    await this.contactRepo.deleteUserContact(ownerId, contactId)
  }

  async list(ownerId, queryParams, limit) {
    const contacts = this.contactRepo.findAllUserContacts(ownerId, queryParams, limit)

    return contacts
  }

  async findByIdAndUpdate(userId, contactId, updateParams) {
    const contact = await this.contactRepo.findByIdAndUpdate(userId, contactId, updateParams)

    return contact
  }

  async matchContactWithUser(organizationId, contactData) {
    const fields = []

    contactData.email && fields.push("email")
    contactData.phone && fields.push("phone")

    if (!fields.length) {
      return
    }

    const emails = contactData.email?.map((email) => email.value)
    const phones = contactData.phone?.map((phone) => phone.value)
    const foundUsersList = await this.userRepo.matchUserContact(organizationId, emails, phones)

    for (const field of fields) {
      const foundUsersObj = {}
      for (const user of foundUsersList) {
        foundUsersObj[user[field]] = user.params._id
      }

      contactData[field].forEach((obj) => {
        if (foundUsersObj[obj.value]) {
          obj["matched_user_id"] = foundUsersObj[obj.value]
        }
      })
    }
  }

  async matchUserWithContactOnCreate(organizationId, userId, phone, email) {
    if (!(email && phone)) {
      return
    }

    const contacts = await this.contactRepo.findByEmailPhone(organizationId, email, phone)
    if (!contacts.length) {
      return
    }

    for (const contact of contacts) {
      const updateParam = {}

      if (!(contact.email && contact.phone)) {
        continue
      }

      email && (updateParam["email"] = await this.#updateFieldOnCreate(contact.email, userId, email))
      phone && (updateParam["phone"] = await this.#updateFieldOnCreate(contact.phone, userId, phone))

      await this.findByIdAndUpdate(contact.user_id, contact._id, updateParam)
    }
  }

  async matchUserWithContactOnUpdate(organizationId, userId, phone, email, oldPhone, oldEmail) {
    if (!((email && oldEmail) || (phone && oldPhone))) {
      return
    }

    const contacts = await this.contactRepo.findByEmailPhone(organizationId, email, phone)
    if (!contacts.length) {
      return
    }

    for (const contact of contacts) {
      const updateParam = {}

      if (!(contact.email && contact.phone)) {
        continue
      }

      email && (updateParam["email"] = await this.#updateFieldOnUpdate(contact.email, userId, email, oldEmail))
      phone && (updateParam["phone"] = await this.#updateFieldOnUpdate(contact.phone, userId, phone, oldPhone))

      await this.findByIdAndUpdate(contact.user_id, contact._id, updateParam)
    }
  }

  async matchUserWithContactOnDelete(organizationId, userId, phone, email) {
    if (!(email && phone)) {
      return
    }

    const query = { $or: [] }
    phone && query.$or.push({ [`phone.value`]: phone })
    email && query.$or.push({ [`email.value`]: email })

    const contacts = await this.contactRepo.findByEmailPhone(organizationId, email, phone)
    if (!contacts.length) {
      return
    }

    for (const contact of contacts) {
      const updateParam = {}

      if (!(contact.email && contact.phone)) {
        continue
      }

      email && (updateParam["email"] = await this.#updateFieldOnDelete(contact.email, email))
      phone && (updateParam["phone"] = await this.#updateFieldOnDelete(contact.phone, phone))

      await this.findByIdAndUpdate(contact.user_id, contact._id, updateParam)
    }
  }

  async #updateFieldOnCreate(data, userId, value) {
    return data.map((el) => {
      if (el.value === value) {
        el["matched_user_id"] = userId
      }
      return el
    })
  }

  async #updateFieldOnUpdate(data, userId, value, oldValue) {
    return data.map((el) => {
      if (el.value === oldValue) {
        el.value = value
      }
      if (el.value === value) {
        el["matched_user_id"] = userId
      }
      return el
    })
  }

  async #updateFieldOnDelete(data, value) {
    return data.map((el) => {
      if (el.value === value) {
        delete el["matched_user_id"]
      }
      return el
    })
  }
}

export default ContactService
