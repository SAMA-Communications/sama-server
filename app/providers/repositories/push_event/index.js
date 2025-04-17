import BaseRepository from "../base.js"

class PushEventRepository extends BaseRepository {
  async prepareParams(params) {
    params.organization_id = this.castOrganizationId(params.organization_id)
    params.user_id = this.castObjectId(params.user_id)
    params.user_ids = this.castObjectIds(params.user_ids)

    params.message = Buffer.from(JSON.stringify(params.payload)).toString("base64")
    delete params.payload

    return await super.prepareParams(params)
  }
}

export default PushEventRepository
