class EncryptionListOperation {
  constructor(encryptionService, sessionService, userRepo) {
    this.encryptionService = encryptionService
    this.sessionService = sessionService
    this.userRepo = userRepo
  }

  async perform(ws, listParams) {
    const userIds = listParams.ids

    if (!userIds.length) {
      const userId = this.sessionService.getSessionUserId(ws)

      const deviceList = await this.encryptionService.encryptionRepo.findAll({ user_id: userId })
      return deviceList.map((device) => device.visibleParams())
    }

    const existUserIds = await this.userRepo.retrieveExistedIds(userIds)

    const deviceList = await this.encryptionService.encryptionRepo.getAllUserDevicesByIds(existUserIds)
    return deviceList
  }
}

export default EncryptionListOperation
