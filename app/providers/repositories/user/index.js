import BaseRepository from '../base.js'

class UserRepository extends BaseRepository {
  async findById(userId) {
    const user = await this.findOne({ _id: userId })

    return user
  }

  async updateActivity(userId, recentActivity) {
    await this.updateOne({ _id: userId }, { $set: { recent_activity: recentActivity } })
  }

  async findAllByIds(userIds) {
    const users = await this.findAll({ _id: { $in: userIds } })

    return users
  }

  async findByLogin(login) {
    const user = await this.findOne({ login })

    return user
  }
}

export default UserRepository