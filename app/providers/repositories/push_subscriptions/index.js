import BaseRepository from "../base.js"

class PushSubscriptionsRepository extends BaseRepository {
  async prepareParams(params) {
    params.user_id = this.castObjectId(params.user_id)

    return await super.prepareParams(params)
  }

  async findAndUpdate(userId, deviceId, updateParams) {
    const subscription = await this.findOneAndUpdate({ user_id: userId, device_udid: deviceId }, { $set: updateParams })

    return subscription
  }

  async findUserSubscription(userId, deviceId) {
    const subscription = await this.findOne({ user_id: userId, device_udid: deviceId })

    return subscription
  }
}

export default PushSubscriptionsRepository
