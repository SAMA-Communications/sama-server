import BaseRepository from "../base.js"

class EncryptedMessageStatusRepository extends BaseRepository {
  async prepareParams(params) {
    params.mid = this.castObjectId(params.mid)
    params.cid = this.castObjectId(params.cid)

    return await super.prepareParams(params)
  }

  async buildAndCreate(mid, cid, identity_keys) {
    const params = { mid, cid }
    identity_keys.forEach((identity_key) => (params[identity_key] = "notdelivered"))

    await this.create(await this.prepareParams(params))
  }

  async updateStatus(mid, identity_keys) {
    const params = {}
    identity_keys.forEach((identity_key) => (params[identity_key] = "notdelivered"))

    await this.updateOne({ mid }, { $set: params })
  }

  async getMidsByIdentityKey(identity_key, cid) {
    const records = await this.findAll({ cid, [identity_key]: "notdelivered" })

    const midsToDelivery = records.map((el) => el.mid)

    const midsToRemove = records
      .filter((obj) => {
        const keys = Object.keys(obj)
        const allowedKeys = ["_id", "mid", "cid", "created_at", "updated_at", identity_key]
        return keys.every((key) => allowedKeys.includes(key))
      })
      .map((obj) => obj.mid)

    await this.deleteMany({ mid: { $in: midsToRemove } })

    await this.updateMany(
      { mid: { $in: midsToDelivery.filter((mid) => !midsToRemove.includes(mid)) } },
      { $unset: { [identity_key]: "" } }
    )

    return { midsToDelivery, midsToRemove }
  }
}

export default EncryptedMessageStatusRepository
