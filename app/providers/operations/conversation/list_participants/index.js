class ConversationListParticipantsOperation {
  constructor(sessionService, userService, conversationService) {
    this.sessionService = sessionService
    this.userService = userService
    this.conversationService = conversationService
  }

  async perform(ws, options) {
    const { cids } = options

    const currentUserId = this.sessionService.getSessionUserId(ws)
    const currentUser = await this.userService.userRepo.findById(currentUserId)

    const { participantIds, participantsIdsByCids } = await this.conversationService.findConversationsParticipantIds(
      cids,
      currentUser
    )

    if (!participantIds.length) {
      return { users: [], conversations: {} }
    }

    const users = await this.userService.userRepo.findAllByIds(participantIds)

    const usersWithAvatars = await this.userService.addAvatarUrl(users)

    const userFields = usersWithAvatars.map((user) => user.visibleParams())

    return { users: userFields, conversations: participantsIdsByCids }
  }
}

export default ConversationListParticipantsOperation
