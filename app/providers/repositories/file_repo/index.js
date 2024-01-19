import { ObjectId } from '../../../lib/db.js'
import BaseRepository from '../../../repositories/base.js'

class FileRepository extends BaseRepository {
  async create(userId, fileObj) {
    const file = new this.Model(fileObj)
    await file.save()

    return file
  }

  async findUserFile(userId, objectId) {
    const file = await this.Model.findOne({ object_id: objectId })

    return file
  }
}

export default FileRepository
