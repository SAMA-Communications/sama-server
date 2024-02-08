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

  async updateActivity(userId, recentActivity) {
    await this.updateOne({ _id: userId }, { $set: { recent_activity: recentActivity } })
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
}

export default UserRepository