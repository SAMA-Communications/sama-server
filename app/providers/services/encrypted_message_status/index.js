class EncryptedMessageStatusService {
  constructor(encryptionRepo, encryptedMessageStatusRepo) {
    this.encryptionRepo = encryptionRepo
    this.encryptedMessageStatusRepo = encryptedMessageStatusRepo
  }

  async markAsNotDelivered(mid, cid, uid) {
    const eMessageStatus = await this.encryptedMessageStatusRepo.findOne({ mid })

    const encryptedDevices = await this.encryptionRepo.findAll({ user_id: uid })
    const identityKeys = encryptedDevices.map((el) => el.identity_key)

    if (!eMessageStatus) {
      await this.encryptedMessageStatusRepo.buildAndCreate(mid, cid, identityKeys)
    } else {
      await this.encryptedMessageStatusRepo.updateStatus(mid, identityKeys)
    }
  }
}

export default EncryptedMessageStatusService
