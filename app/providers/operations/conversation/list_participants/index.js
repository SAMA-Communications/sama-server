class ConversationListParticipantsOperation {
  constructor(sessionService, userService, conversationService) {
    this.sessionService = sessionService
    this.userService = userService
    this.conversationService = conversationService
  }

  async perform(ws, options) {
    const { cids } = options
    const { userId: currentUserId, organizationId } = this.sessionService.getSession(ws)

    const { participantIds, participantsIdsByCids } = await this.conversationService.findConversationsParticipantIds(
      organizationId,
      cids,
      currentUserId
    )

    if (!participantIds.length) {
      return { users: [], conversations: {} }
    }

    const users = await this.userService.userRepo.findWithOrgScopeByIds(organizationId, participantIds)

    const usersWithAvatars = await this.userService.addAvatarUrl(users)

    const userFields = usersWithAvatars.map((user) => user.visibleParams())

    return { users: userFields, conversations: participantsIdsByCids }
  }
}

export default ConversationListParticipantsOperation
