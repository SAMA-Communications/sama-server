import BaseRepository from './base.js'

import BlockedUser from '../models/blocked_user.js'

import { inMemoryBlockList } from '../store/in_memory.js'

class BlockListRepository extends BaseRepository {
  constructor(BlockedUserModel, inMemoryStorage) {
    super(BlockedUserModel)

    this.inMemoryStorage = inMemoryStorage
  }

  async warmCache() {
    const $match = {}
    const $group = {
      _id: '$blocked_user_id',
      users: { $push: '$user_id' },
    }

    const dbBlockedUser = await this.Model.aggregate([
      { $match },
      { $group },
    ])

    dbBlockedUser.forEach((obj) => {
      inMemoryBlockList[obj._id?.toString()] = obj.users.reduce(
        (arr, field) => ({ ...arr, [field]: true }),
        {}
      )
    })

    console.log('[Cache] BlockList cache upload success')
  }

  async block(blocked_user_id, user_id) {
    if (!this.inMemoryStorage[blocked_user_id]) {
      this.inMemoryStorage[blocked_user_id] = {}
    }

    const blockedParams = {
      blocked_user_id,
      user_id,
    }

    const isUserBlocked = await this.Model.findOne(blockedParams)

    if (!isUserBlocked) {
      const blockedUser = new this.Model(blockedParams)
      await blockedUser.save()
    }

    this.inMemoryStorage[blocked_user_id][user_id] = true
  }

  async unblock(blocked_user_id, user_id) {
    const record = await this.Model.findOne({
      blocked_user_id,
      user_id,
    })

    if (record) {
      await record.delete()
    }

    if (this.inMemoryStorage[blocked_user_id]) {
      delete this.inMemoryStorage[blocked_user_id][user_id]

      !Object.keys(this.inMemoryStorage[blocked_user_id]).length &&
        delete this.inMemoryStorage[blocked_user_id]
    }
  }

  async delete(user_id) {
    delete this.inMemoryStorage[user_id]

    for (const uId in this.inMemoryStorage) {
      if (this.inMemoryStorage[uId]) {
        delete this.inMemoryStorage[uId][user_id]

        !Object.keys(this.inMemoryStorage[uId]).length &&
          delete this.inMemoryStorage[uId]
      }
    }

    await this.Model.deleteMany({
      $or: [{ blocked_user_id: user_id }, { user_id }],
    })
  }

  async getBlockingUsers(blocked_user_id, users_filter) {
    const userObject = this.inMemoryStorage[blocked_user_id]

    return userObject
      ? Object.keys(userObject).filter((u) => users_filter.includes(u))
      : []
  }

  async getBlockList(user_id) {
    const blockedUsers = await this.Model.findAll({ user_id }, ['blocked_user_id'])
    return blockedUsers ? blockedUsers.map(u => u.blocked_user_id) : []
  }
}

export default new BlockListRepository(BlockedUser, inMemoryBlockList)