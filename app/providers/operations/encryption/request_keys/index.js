class EncryptionRequestKeysOperation {
  constructor(encryptionService, userRepo) {
    this.encryptionService = encryptionService
    this.userRepo = userRepo
  }

  async perform(ws, listParams) {
    const userIds = listParams.user_ids

    const existUserIds = await this.userRepo.retrieveExistedIds(userIds)

    const deviceList = await this.encryptionService.encryptionRepo.getUsersDevices(existUserIds)

    await this.encryptionService.removeFirstOneTimeKey(userIds)

    return deviceList
  }
}

export default EncryptionRequestKeysOperation
