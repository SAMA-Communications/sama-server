class EncryptionRequestKeysOperation {
  constructor(sessionService, userRepo, encryptionService) {
    this.sessionService = sessionService
    this.userRepo = userRepo
    this.encryptionService = encryptionService
  }

  async perform(ws, listParams) {
    const userIds = listParams.user_ids

    const { organizationId } = this.sessionService.getSession(ws)

    const existUserIds = await this.userRepo.retrieveExistedIds(organizationId, userIds)

    const deviceList = await this.encryptionService.encryptionRepo.getUsersDevices(existUserIds)

    await this.encryptionService.removeFirstOneTimeKey(deviceList)

    return deviceList
  }
}

export default EncryptionRequestKeysOperation
