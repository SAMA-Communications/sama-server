import { CONSTANTS as MAIN_CONSTANTS } from "../../../../constants/constants.js"

class ConversationSearchOperation {
  constructor(sessionService, conversationService) {
    this.sessionService = sessionService
    this.conversationService = conversationService
  }

  async perform(ws, searchParams) {
    const { userId: currentUserId, organizationId } = this.sessionService.getSession(ws)

    const ignoreIds = []

    const limit = Math.min(searchParams.limit || MAIN_CONSTANTS.SEARCH_LIMIT_MAX, MAIN_CONSTANTS.SEARCH_LIMIT_MAX)

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
