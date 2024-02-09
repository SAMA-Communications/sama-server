import BaseRepository from '../base.js'

class UserRepository extends BaseRepository {
  async findById(userId) {
    const user = await this.findOne({ _id: userId })

    return user
  }

  async findAllByIds(userIds) {
    const users = await this.findAll({ _id: { $in: userIds } })

    return users
  }

  async findByLogin(login) {
    const user = await this.findOne({ login })

    return user
  }

  async findExisted(login, email, phone) {
    const query = [{ login }]

    if (email) {
      query.push(({ email }))
    }

    if (phone) {
      query.push(({ phone }))
    }

    const user = await this.findOne({ $or: query })

    return user
  }

  async search({ loginMatch, ignoreIds, timeFromUpdate }, limit) {
    const query = {
      _id: { $nin: ignoreIds },
      login: { $regex: new RegExp(`^${loginMatch}.*`, 'i') },
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