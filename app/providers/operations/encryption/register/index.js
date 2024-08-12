class EncryptionRegisterOperation {
  constructor(encryptionService) {
    this.encryptionService = encryptionService
  }

  async perform(registerDeviceParams) {
    const existingDevice = await this.encryptionService.encryptionRepo.findByIdentityKey(
      registerDeviceParams.identity_key
    )

    if (existingDevice) {
      await this.encryptionService.update(existingDevice, registerDeviceParams)
    } else {
      await this.encryptionService.encryptionRepo.create(registerDeviceParams)
    }
  }
}

export default EncryptionRegisterOperation
