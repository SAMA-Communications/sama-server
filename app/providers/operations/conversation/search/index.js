class ConversationSearchOperation {
  constructor(config, sessionService, conversationService) {
    this.config = config
    this.sessionService = sessionService
    this.conversationService = conversationService
  }

  async perform(ws, searchParams) {
    const { userId: currentUserId, organizationId } = this.sessionService.getSession(ws)

    const ignoreIds = []

    const maxSearchLimit = this.config.get("conversation.searchLimit")
    const limit = Math.min(searchParams.limit || maxSearchLimit, maxSearchLimit)

    const conversationsSearchResult = await this.conversationService.conversationRepo.search(
      organizationId,
      { chatNameMatch: searchParams.name, ignoreIds, timeFromUpdate: searchParams.updated_at?.gt },
      limit
    )

    const conversationIds = conversationsSearchResult.map((conversion) => conversion._id)

    return conversationIds
  }
}

export default ConversationSearchOperation
