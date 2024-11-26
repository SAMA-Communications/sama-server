import DecryptionFailedMessagesPublicFields from "@sama/DTO/Response/message/decryption_failed/public_fields.js"

class MessageDecryptionFailedOperation {
  constructor(sessionService, userService, messageService, conversationService) {
    this.sessionService = sessionService
    this.userService = userService
    this.messageService = messageService
    this.conversationService = conversationService
  }

  async perform(ws, messageParams) {
    const { cid, ids: mids } = messageParams

    const currentUserId = this.sessionService.getSessionUserId(ws)
    const currentUser = await this.userService.userRepo.findById(currentUserId)

    await this.messageService.upsertMessageStatusInConversation(cid, currentUser, mids)

    const responseReceiverUid = await this.conversationService.findOpponentId(cid, currentUserId)

    const statuses = new DecryptionFailedMessagesPublicFields({ cid, messageIds: mids, from: currentUserId })

    return { receiverUserId: responseReceiverUid, statuses }
  }
}

export default MessageDecryptionFailedOperation
