import BaseRepository from "../base.js"

class FileRepository extends BaseRepository {
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
