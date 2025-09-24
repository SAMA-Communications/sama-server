import { google } from "@ai-sdk/google"
import { generateText } from "ai"

import { ERROR_STATUES } from "../../../../constants/errors.js"
import { CONSTANTS as MAIN_CONSTANTS } from "../../../../constants/constants.js"

class MessageSummaryOperation {
  constructor(helpers, sessionService, userService, messageService, conversationService) {
    this.helpers = helpers
    this.sessionService = sessionService
    this.userService = userService
    this.messageService = messageService
    this.conversationService = conversationService
  }

  async perform(ws, messageSummaryParams) {
    const { cid, filter } = messageSummaryParams
    const { userId: currentUserId, organizationId } = this.sessionService.getSession(ws)

    await this.#hasAccess(organizationId, cid, currentUserId)

    let filteredMessages = []
    let since

    switch (filter) {
      case MAIN_CONSTANTS.CHAT_SUMMARY_FITLERS.LAST_7_DAYS:
        since = new Date(Date.now() - MAIN_CONSTANTS.WEEK_IN_MS)
        filteredMessages =
          (await this.messageService.messagesList(cid, { native_id: currentUserId }, { updatedAt: { gt: since } }))
            ?.messages ?? []
        break
      case MAIN_CONSTANTS.CHAT_SUMMARY_FITLERS.LAST_DAY:
        since = new Date(Date.now() - MAIN_CONSTANTS.DAY_IN_MS)
        filteredMessages =
          (await this.messageService.messagesList(cid, { native_id: currentUserId }, { updatedAt: { gt: since } }))
            ?.messages ?? []
        break
      case MAIN_CONSTANTS.CHAT_SUMMARY_FITLERS.UNREADS:
        filteredMessages = (await this.messageService.getUnreadMessages(cid, currentUserId)) ?? []
        break
      default:
        break
    }

    let returnMessage = MAIN_CONSTANTS.SUMMARY_AI_DEFAULT_RETURN_MESSAGE

    if (filteredMessages.length) {
      const userIds = [...new Set(filteredMessages.map(({ from }) => from))]
      const users = await this.userService.findUsersByIds(organizationId, userIds)
      const userObjectsByIds = Object.fromEntries(users.map((user) => [user._id, user]))

      const messagesString = filteredMessages
        .filter(({ body }) => body)
        .map(({ from, body }) => `- ${this.helpers.getDisplayName(userObjectsByIds[from])}: ${body}`)
        .join("\n")

      try {
        const result = await generateText({
          model: google(process.env.GOOGLE_GENERATIVE_AI_MODEL),
          prompt: (MAIN_CONSTANTS.SUMMARY_AI_PROMPT + messagesString).trim(),
        })
        returnMessage = result.text
      } catch (err) {
        console.error("[ai.agent.error]:", err)
        throw new Error(ERROR_STATUES.AI_AGENT_ERROR.message, {
          cause: ERROR_STATUES.AI_AGENT_ERROR,
        })
      }
    }

    return { message: returnMessage }
  }

  async #hasAccess(organizationId, conversationId, currentUserId) {
    const { conversation, asParticipant } = await this.conversationService.hasAccessToConversation(
      organizationId,
      conversationId,
      currentUserId
    )

    if (!conversation) {
      throw new Error(ERROR_STATUES.CONVERSATION_NOT_FOUND.message, {
        cause: ERROR_STATUES.CONVERSATION_NOT_FOUND,
      })
    }

    if (conversation.type === "c") {
      throw new Error(ERROR_STATUES.FORBIDDEN.message, {
        cause: ERROR_STATUES.FORBIDDEN,
      })
    }

    if (!asParticipant) {
      throw new Error(ERROR_STATUES.FORBIDDEN.message, {
        cause: ERROR_STATUES.FORBIDDEN,
      })
    }
  }
}

export default MessageSummaryOperation
