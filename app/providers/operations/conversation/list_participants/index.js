import { slice } from "@sama/utils/req_res_utils.js"

class ConversationListParticipantsOperation {
  constructor(sessionService, userService, messageService, conversationService) {
    this.sessionService = sessionService
    this.userService = userService
    this.messageService = messageService
    this.conversationService = conversationService
  }

  async perform(ws, options) {
    const { cids, includes } = options

    const currentUserId = this.sessionService.getSessionUserId(ws)
    const currentUser = await this.userService.userRepo.findById(currentUserId)

    const verifiedConversationIds = await this.conversationService.verifiyParticipantConversationIds(cids, currentUser)

    const participantIdsFromConversations =
      await this.conversationService.findConversationsParticipantIds(verifiedConversationIds)

    const participantIdsFromMessages = await this.messageService.messageRepo.participantIdsFromMessages(
      verifiedConversationIds,
      participantIdsFromConversations
    )

    const participantIds = [...participantIdsFromConversations, ...participantIdsFromMessages]

    if (!participantIds.length) {
      return []
    }

    const pluckFields = includes
      ? ["_id", "native_id"]
      : ["_id", "native_id", "first_name", "last_name", "login", "email", "phone"]

    const users = await this.userService.userRepo.findAllByIds(participantIds)

    const userFields = users.map((user) => slice(user, pluckFields, true))

    return userFields
  }
}

export default ConversationListParticipantsOperation
