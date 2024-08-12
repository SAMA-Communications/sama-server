import BaseRepository from "../base.js"

class EncryptionRepository extends BaseRepository {
  async findByIdentityKey(identity_key) {
    const device = await this.findOne({ identity_key })

    return device
  }

  async update(recordId, updateParams) {
    const device = await this.findOneAndUpdate({ _id: recordId }, { $set: updateParams })

    return device
  }
}

export default EncryptionRepository
