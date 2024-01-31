import BaseRepository from '../base.js'

class UserRepository extends BaseRepository {
  async findById(userId) {
    const user = await this.findOne({ _id: userId })

    return user
  }

  async findByLogin(login) {
    const user = await this.findOne({ login })

    return user
  }
}

export default UserRepository