class EncryptionListOperation {
  constructor(encryptionService, sessionService) {
    this.encryptionService = encryptionService
    this.sessionService = sessionService
  }

  async perform(ws) {
    const userId = this.sessionService.getSessionUserId(ws)

    const deviceList = await this.encryptionService.encryptionRepo.getAllUserDevices(userId)

    return deviceList.map((obj) => ({
      identity_key: obj.identity_key,
      signed_key: obj.signed_key,
      device_id: obj.device_id,
    }))
  }
}

export default EncryptionListOperation
