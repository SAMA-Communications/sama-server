class EncryptionRegisterOperation {
  constructor(encryptionService, sessionService) {
    this.encryptionService = encryptionService
    this.sessionService = sessionService
  }

  async perform(ws, registerDeviceParams) {
    const userId = this.sessionService.getSessionUserId(ws)
    const existingDevice = await this.encryptionService.encryptionRepo.findByIdentityKey(
      registerDeviceParams.identity_key
    )

    if (existingDevice) {
      await this.encryptionService.update(existingDevice, registerDeviceParams)
    } else {
      await this.encryptionService.encryptionRepo.create({
        user_id: userId,
        ...registerDeviceParams,
      })
    }
  }
}

export default EncryptionRegisterOperation
