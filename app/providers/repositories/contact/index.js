import BaseRepository from "../base.js"

class ContactRepository extends BaseRepository {
  async prepareParams(params) {
    params.user_id = this.castObjectId(params.user_id)

    return await super.prepareParams(params)
  }

  async findByIdAndUpdate(userId, contactId, updateParams) {
    const contact = await this.findOneAndUpdate({ _id: contactId, user_id: userId }, { $set: updateParams })

    return contact
  }

  async findByEmailPhone(organizationId, email, phone, limit) {
    const query = { organization_id: organizationId, $or: [] }

    email && query.$or.push({ [`phone.value`]: phone })
    phone && query.$or.push({ [`email.value`]: email })

    const contacts = await this.findAll(query, null, limit, { sort: -1 })

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
