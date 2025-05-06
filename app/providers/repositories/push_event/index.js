import BaseRepository from "../base.js"

class PushEventRepository extends BaseRepository {
  async prepareParams(params) {
    params.user_id = this.castUserId(params.user_id)
    params.user_ids = this.castUserIds(params.user_ids)

    params.message = Buffer.from(JSON.stringify(params.payload)).toString("base64")
    delete params.payload

    return await super.prepareParams(params)
  }
}

export default PushEventRepository
