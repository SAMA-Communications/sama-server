import BaseRepository from "../base.js"

class FileRepository extends BaseRepository {
  async prepareParams(params) {
    params.organization_id = this.castOrganizationId(params.organization_id)
    params.user_id = this.castObjectId(params.user_id)

    return await super.prepareParams(params)
  }

  async findByIdWithOrgScope(organizationId, objectId) {
    const query = {
      organization_id: organizationId,
      object_id: objectId,
    }

    const file = await this.findOne(query)

    return file
  }
}

export default FileRepository
