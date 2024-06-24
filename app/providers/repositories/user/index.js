import BaseRepository from "../base.js"

class UserRepository extends BaseRepository {
  async findByLogin(login) {
    const user = await this.findOne({ login })

    return user
  }

  async findByIds(ids) {
    const users = await this.findAll(
      { _id: { $in: ids } },
      ["native_id", "_id", "login", "first_name", "last_name", "updated_at"],
      100
    )

    return users
  }

  async findRegistered(login, email, phone) {
    const query = [{ login }]

    if (email) {
      query.push({ email })
    }

    if (phone) {
      query.push({ phone })
    }

    const user = await this.findOne({ $or: query })

    return user
  }

  async retrieveExistedIds(userIds) {
    const existedUserIds = await this.getAllIdsBy({ _id: { $in: userIds } })

    return existedUserIds
  }

  async search({ loginMatch, ignoreIds, timeFromUpdate }, limit) {
    const escapedLoginMatch = loginMatch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const regexPattern = new RegExp(`${escapedLoginMatch}.*`, "i")

    const query = {
      _id: { $nin: ignoreIds },
      $or: [
        { login: { $regex: regexPattern } },
        { first_name: { $regex: regexPattern } },
        { last_name: { $regex: regexPattern } },
      ],
    }

    if (timeFromUpdate) {
      query.updated_at = { $gt: new Date(timeFromUpdate) }
    }

    const users = await this.findAll(query, null, limit)

    return users
  }

  async matchUserContact(emails, phones) {
    const orQuery = []

    if (emails?.length) {
      orQuery.push({ email: { $in: emails } })
    }

    if (phones?.length) {
      orQuery.push({ phone: { $in: phones } })
    }

    const users = await this.findAll({ $or: orQuery })

    return users
  }

  async update(userId, updateParams) {
    const user = await this.findOneAndUpdate({ _id: userId }, { $set: updateParams })

    return user
  }

  async updateActivity(userId, recentActivity) {
    await this.updateOne({ _id: userId }, { $set: { recent_activity: recentActivity } })
  }
}

export default UserRepository
