import BaseRepository from "../base.js"

class ContactRepository extends BaseRepository {
  async findByIdAndUpdate(contactId, updateParams) {
    const contact = await this.findOneAndUpdate({ _id: contactId }, { $set: updateParams })

    return contact
  }

  async findByEmailPhone(email, phone, limit) {
    const query = { $or: [] }

    email && query.$or.push({ [`phone.value`]: phone })
    phone && query.$or.push({ [`email.value`]: email })

    const contacts = await this.findAll(query, null, limit)

    return contacts
  }

  async findAllUserContacts(ownerId, query, limit) {
    const queryParams = { user_id: ownerId }

    if (query.updated_at) {
      queryParams.updated_at = { $gt: new Date(query.updated_at) }
    }

    const contacts = await this.findAll(queryParams, null, limit)

    return contacts
  }

  async deleteUserContact(ownerId, contactId) {
    const query = { _id: contactId, user_id: ownerId }

    await this.deleteMany(query)
  }
}

export default ContactRepository
