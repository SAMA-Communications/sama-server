class EncryptionListOperation {
  constructor(encryptionService, sessionService) {
    this.encryptionService = encryptionService
    this.sessionService = sessionService
  }

  async perform(ws) {
    const userId = this.sessionService.getSessionUserId(ws)

    const deviceList = await this.encryptionService.encryptionRepo.findAll({ user_id: userId })
    return deviceList.map((device) => ({ identity_key: device.identity_key, signed_key: device.signed_key }))
  }
}

export default EncryptionListOperation
