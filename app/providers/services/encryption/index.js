class EncryptionService {
  constructor(encryptionRepo) {
    this.encryptionRepo = encryptionRepo
  }

  async update(existDevice, updateParams) {
    const updatedDevice = await this.encryptionRepo.update(existDevice._id, updateParams)

    return updatedDevice
  }
}

export default EncryptionService
