class EncryptionListOperation {
  constructor(encryptionService, sessionService) {
    this.encryptionService = encryptionService
    this.sessionService = sessionService
  }

  async perform(ws) {
    const userId = this.sessionService.getSessionUserId(ws)

    const deviceList = await this.encryptionService.encryptionRepo.getAllUserDevices(userId)

    return deviceList.map((obj) => ({
      id: obj._id,
      identity_key: obj.identity_key,
      signed_key: obj.signed_key,
    }))
  }
}

export default EncryptionListOperation
