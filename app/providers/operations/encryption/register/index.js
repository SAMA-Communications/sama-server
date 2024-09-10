class EncryptionRegisterOperation {
  constructor(encryptionService, sessionService) {
    this.encryptionService = encryptionService
    this.sessionService = sessionService
  }

  async perform(ws, registerDeviceParams) {
    const userId = this.sessionService.getSessionUserId(ws)
    const deviceId = this.sessionService.getDeviceId(ws, userId)
    const existingDevice = await this.encryptionService.encryptionRepo.findByDeviceId(deviceId, userId)

    if (existingDevice) {
      await this.encryptionService.update(existingDevice, registerDeviceParams)
    } else {
      await this.encryptionService.encryptionRepo.create({
        user_id: userId,
        device_id: deviceId,
        ...registerDeviceParams,
      })
    }
  }
}

export default EncryptionRegisterOperation
