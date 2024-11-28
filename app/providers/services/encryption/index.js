class EncryptionService {
  constructor(encryptionRepo) {
    this.encryptionRepo = encryptionRepo
  }

  async update(existDevice, updateParams) {
    const updatedDevice = await this.encryptionRepo.update(existDevice._id, updateParams)

    return updatedDevice
  }

  async removeFirstOneTimeKey(user_ids) {
    // await this.encryptionRepo.updateMany({ user_id: { $in: user_ids } }, { $pop: { one_time_pre_keys: -1 } })
  }
}

export default EncryptionService
