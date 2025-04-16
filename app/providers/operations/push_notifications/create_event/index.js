import { ERROR_STATUES } from "../../../../constants/errors.js"

class PushEventCreateOperation {
  constructor(sessionService, userService, pushNotificationService) {
    this.sessionService = sessionService
    this.userService = userService
    this.pushNotificationService = pushNotificationService
  }

  async perform(ws, createPushEventParams) {
    const { recipients_ids, message } = createPushEventParams

    const { userId: currentUserId, organizationId } = this.sessionService.getSession(ws)

    const recipients = await this.userService.userRepo.retrieveExistedIds(recipients_ids)

    if (!recipients.length) {
      throw new Error(ERROR_STATUES.RECIPIENTS_NOT_FOUND.message, {
        cause: ERROR_STATUES.RECIPIENTS_NOT_FOUND,
      })
    }

    const pushEvent = await this.pushNotificationService.createEvent(organizationId, currentUserId, recipients_ids, message)

    return pushEvent
  }
}

export default PushEventCreateOperation
