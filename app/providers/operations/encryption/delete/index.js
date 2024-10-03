import { ERROR_STATUES } from "../../../../constants/errors.js"

class EncryptionDeleteOperation {
  constructor(encryptionService, sessionService, helpers) {
    this.encryptionService = encryptionService
    this.sessionService = sessionService
    this.helpers = helpers
  }

  async perform(ws, deleteParams) {
    const device = await this.encryptionService.encryptionRepo.findByDeviceId(deleteParams.device_id)

    const userId = this.sessionService.getSessionUserId(ws)

    if (!device || !this.helpers.isEqualsNativeIds(device.user_id, userId)) {
      throw new Error(ERROR_STATUES.FORBIDDEN.message, {
        cause: ERROR_STATUES.FORBIDDEN,
      })
    }

    await this.encryptionService.encryptionRepo.deleteById(device._id)
  }
}

export default EncryptionDeleteOperation
