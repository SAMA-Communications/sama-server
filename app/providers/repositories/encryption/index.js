import BaseRepository from "../base.js"

class EncryptionRepository extends BaseRepository {
  async findByDeviceId(device_id, user_id) {
    const device = await this.findOne({ device_id, user_id })

    return device
  }

  async update(recordId, updateParams) {
    const device = await this.findOneAndUpdate({ _id: recordId }, { $set: updateParams })

    return device
  }

  async removeByDeviceId(user_id, device_id) {
    const record = await this.findOne({ user_id, device_id })
    if (record) {
      await this.deleteById(record.params._id)
    }
  }

  async getAllUserDevices(user_id) {
    const devices = await this.findAll({ user_id })

    return devices
  }

  async getUsersDevices(uids) {
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
      one_time_pre_key: 1,
      devices: 1,
    }
    const aggregatedResult = await this.aggregate([{ $match }, { $group }, { $sort }, { $project }])

    const result = {}

    aggregatedResult.forEach(
      (obj) =>
        (result[obj._id] = obj.devices.map((device) => ({
          identity_key: device.identity_key,
          signed_key: device.signed_key,
          one_time_pre_key: Object.values(device.one_time_pre_keys)[0],
        })))
    )

    return result
  }
}

export default EncryptionRepository
