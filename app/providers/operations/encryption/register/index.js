class EncryptionRegisterOperation {
  constructor(encryptionService, sessionService) {
    this.encryptionService = encryptionService
    this.sessionService = sessionService
  }

  async perform(ws, registerDeviceParams) {
    const existingDevice = await this.encryptionService.encryptionRepo.findByIdentityKey(
      registerDeviceParams.identity_key
    )

    if (existingDevice) {
      await this.encryptionService.update(existingDevice, registerDeviceParams)
    } else {
      const currentuserId = this.sessionService.getSessionUserId(ws)
      await this.encryptionService.encryptionRepo.create({ user_id: currentuserId, ...registerDeviceParams })
    }
  }
}

export default EncryptionRegisterOperation
