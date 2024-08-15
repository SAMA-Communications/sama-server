class EncryptionRegisterOperation {
  constructor(encryptionService, sessionService) {
    this.encryptionService = encryptionService
    this.sessionService = sessionService
  }

  async perform(ws, registerDeviceParams) {
    const userId = this.sessionService.getSessionUserId(ws)
    const deviceId = this.sessionService.getDeviceId(ws, userId)
    const existingDevice = await this.encryptionService.encryptionRepo.findByDeviceId(deviceId)

    if (existingDevice) {
      await this.encryptionService.update(existingDevice, registerDeviceParams)
    } else {
      await this.encryptionService.encryptionRepo.create({
        device_id: deviceId,
        user_id: userId,
        ...registerDeviceParams,
      })
    }
  }
}

export default EncryptionRegisterOperation
