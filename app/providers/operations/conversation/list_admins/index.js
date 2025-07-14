class ConversationListAdminsOperation {
  constructor(sessionService, userService, conversationService) {
    this.sessionService = sessionService
    this.userService = userService
    this.conversationService = conversationService
  }

  async perform(ws, options) {
    const { cids } = options
    const { userId: currentUserId, organizationId } = this.sessionService.getSession(ws)

    const conversations = await this.conversationService.validateConvIdsWhichUserHasAccessAsAdmin(organizationId, cids, currentUserId)

    if (!conversations.length) {
      return { users: [], conversations: {} }
    }

    const { adminIds, adminIdsByCids } = await this.conversationService.findConversationsAdminIds(conversations)

    const users = await this.userService.userRepo.findAllByIds(adminIds)

    const usersWithAvatars = await this.userService.addAvatarUrl(users)

    const userFields = usersWithAvatars.map((user) => user.visibleParams())

    return { users: userFields, conversations: adminIdsByCids }
  }
}

export default ConversationListAdminsOperation
