import BaseRepository from "./base.js"

import ServiceLocatorContainer from "../common/ServiceLocatorContainer.js"

import Contact from "../models/contact.js"

class ContactsMatchRepository extends BaseRepository {
  async #getRecords(query) {
    if (!query?.$or?.length) {
      return []
    }

    const records = []
    let [tmpRecords, timeParam] = [[], null]

    do {
      if (timeParam) {
        query["created_at"] = { $gt: timeParam }
      }
      tmpRecords = await this.Model.findAll(query)

      if (!tmpRecords.length) {
        break
      }

      records.push(...tmpRecords)
      timeParam = tmpRecords[tmpRecords.length - 1].created_at
    } while (tmpRecords.length === 100)

    return records
  }

  async #updateFieldOnCreate(data, userId, value) {
    return data.map((el) => {
      if (el.value === value) {
        el["matched_user_id"] = userId
      }
      return el
    })
  }

  async matchUserWithContactOnCreate(userId, phone, email) {
    if (!(email && phone)) {
      return
    }

    const query = { $or: [] }
    phone && query.$or.push({ [`phone.value`]: phone })
    email && query.$or.push({ [`email.value`]: email })

    const records = await this.#getRecords(query)
    if (!records.length) {
      return
    }

    for (const r of records) {
      const updateParam = {}

      if (!(r.email && r.phone)) {
        continue
      }

      email && (updateParam["email"] = await this.#updateFieldOnCreate(r.email, userId, email))
      phone && (updateParam["phone"] = await this.#updateFieldOnCreate(r.phone, userId, phone))

      await this.Model.updateOne({ _id: r._id.toString() }, { $set: updateParam })
    }
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

  async matchUserWithContactOnUpdate(userId, phone, email, oldPhone, oldEmail) {
    if (!((email && oldEmail) || (phone && oldPhone))) {
      return
    }

    const query = { $or: [] }
    phone && query.$or.push({ [`phone.value`]: phone }, { [`phone.value`]: oldPhone })
    email && query.$or.push({ [`email.value`]: email }, { [`email.value`]: oldEmail })

    const records = await this.#getRecords(query)
    if (!records.length) {
      return
    }

    for (const r of records) {
      const updateParam = {}

      if (!(r.email && r.phone)) {
        continue
      }

      email && (updateParam["email"] = await this.#updateFieldOnUpdate(r.email, userId, email, oldEmail))
      phone && (updateParam["phone"] = await this.#updateFieldOnUpdate(r.phone, userId, phone, oldPhone))

      await this.Model.updateOne({ _id: r._id.toString() }, { $set: updateParam })
    }
  }

  async #updateFieldOnDelete(data, value) {
    return data.map((el) => {
      if (el.value === value) {
        delete el["matched_user_id"]
      }
      return el
    })
  }

  async matchUserWithContactOnDelete(userId, phone, email) {
    if (!(email && phone)) {
      return
    }

    const query = { $or: [] }
    phone && query.$or.push({ [`phone.value`]: phone })
    email && query.$or.push({ [`email.value`]: email })

    const records = await this.#getRecords(query)
    if (!records.length) {
      return
    }

    for (const r of records) {
      const updateParam = {}

      if (!(r.email && r.phone)) {
        continue
      }

      email && (updateParam["email"] = await this.#updateFieldOnDelete(r.email, email))
      phone && (updateParam["phone"] = await this.#updateFieldOnDelete(r.phone, phone))

      await this.Model.updateOne({ _id: r._id.toString() }, { $set: updateParam })
    }
  }

  async matchContactWithUser(contactData) {
    const fields = []

    contactData.email && fields.push("email")
    contactData.phone && fields.push("phone")

    if (!fields.length) {
      return
    }

    const userService = ServiceLocatorContainer.use("UserService")

    const emails = contactData.email?.map((email) => email.value)
    const phones = contactData.phone?.map((phone) => phone.value)
    const foundUsersList = await userService.userRepo.matchUserContact(emails, phones)

    for (const field of fields) {
      const foundUsersObj = {}
      for (const user of foundUsersList) {
        foundUsersObj[user.params[field]] = user.params._id
      }

      contactData[field].forEach((obj) => {
        if (foundUsersObj[obj.value]) {
          obj["matched_user_id"] = foundUsersObj[obj.value]
        }
      })
    }
  }
}

export default new ContactsMatchRepository(Contact)
