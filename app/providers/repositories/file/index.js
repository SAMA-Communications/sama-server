import BaseRepository from "../base.js"

class FileRepository extends BaseRepository {
  async create(userId, fileObj) {
    const file = await super.create(fileObj)

    return file
  }

  async findUserFile(userId, objectId) {
    const file = await this.findOne({ object_id: objectId })

    return file
  }
}

export default FileRepository
