import { slice } from '@sama/utils/req_res_utils.js'

class ConversationListParticipantsOperation {
  constructor(
    sessionService,
    userService,
    conversationService,
    userMapper
  ) {
    this.sessionService = sessionService
    this.userService = userService
    this.conversationService = conversationService
    this.userMapper = userMapper
  }

  async perform(ws, options) {
    const { cids, includes } = options

    const currentUserId = this.sessionService.getSessionUserId(ws)
    
    const participantIds = await this.conversationService.findConversationsParticipantIds(cids, currentUserId)

    if (!participantIds.length) {
      return []
    }

    const pluckFields = includes ? ['_id'] : ['_id', 'first_name', 'last_name', 'login', 'email', 'phone']

    const users = await this.userService.userRepo.findAllByIds(participantIds)
    const mappedUsers = []

    for (const user of users) {
      const mappedUser = await this.userMapper(user)
      mappedUsers.push(mappedUser)
    }

    const userFields = mappedUsers.map(user => slice(user.params, pluckFields, true))

    return userFields
  }
}

export default ConversationListParticipantsOperation
