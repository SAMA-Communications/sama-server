import BaseRepository from "../base.js"

class EncryptionRepository extends BaseRepository {
  async findByIdentityKey(identity_key) {
    const device = await this.findOne({ identity_key })

    return device
  }

  async findById(recordId) {
    const device = await this.findOne({ _id: recordId })

    return device
  }

  async update(recordId, updateParams) {
    const device = await this.findOneAndUpdate({ _id: recordId }, { $set: updateParams })

    return device
  }

  async getAllUserDevicesByIds(uids) {
    const userIds = this.castObjectIds(uids)

    const $match = {
      user_id: { $in: userIds },
    }

    const $group = {
      _id: "$user_id",
      devices: { $push: "$$ROOT" },
    }

    const $sort = { _id: -1 }

    const $project = {
      _id: 1,
      identity_key: 1,
      signed_key: 1,
      one_time_pre_keys: 1,
      devices: 1,
    }
    const aggregatedResult = await this.aggregate([{ $match }, { $group }, { $sort }, { $project }])

    const result = {}

    aggregatedResult.forEach(
      (obj) =>
        (result[obj._id] = obj.devices.map((device) => ({
          identity_key: device.identity_key,
          signed_key: device.signed_key,
          one_time_pre_keys: device.one_time_pre_keys,
        })))
    )

    return result
  }
}

export default EncryptionRepository
