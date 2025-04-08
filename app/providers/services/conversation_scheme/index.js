import { ERROR_STATUES } from "../../../constants/errors.js"

class ConversationSchemeService {
  constructor(conversationSchemeRepo) {
    this.conversationSchemeRepo = conversationSchemeRepo
  }

  async createSchemeByConversationId(conversation_id, scheme, user_id) {
    await this.conversationSchemeRepo.create({ conversation_id, scheme, updated_by: user_id })
  }

  async updateExistedConversationScheme(conversation_id, scheme, user_id) {
    await this.conversationSchemeRepo.updateOne({ conversation_id }, { $set: { scheme, updated_by: user_id } })
  }

  async getSchemeByConversationId(conversation_id) {
    const record = await this.conversationSchemeRepo.findOne({ conversation_id })

    return record
  }

  async deleteConversationScheme(record_id) {
    await this.conversationSchemeRepo.deleteById(record_id)
  }

  async prepareAndExecuteConversationScheme(code, message, user) {
    let compilationResult = { data: {}, errorMessage: null }

    const options = {
      allowFetch: false,
      allowFs: false,
      env: {
        MESSAGE: message,
        USER: user,
        RESOLVE: (value) => (compilationResult.data = value || {}),
        REJECT: (value) => (compilationResult.errorMessage = value),
      },
    }

    await this.conversationSchemeRepo.runCodeViaSandbox(code, options)

    if (compilationResult.errorMessage) {
      const errorMessage =
        typeof compilationResult.errorMessage === "string"
          ? compilationResult.errorMessage
          : compilationResult.errorMessage?.message || ERROR_STATUES.MESSAGE_BLOCKED_BY_SCHEME.message

      const errorCause = {
        ...ERROR_STATUES.MESSAGE_BLOCKED_BY_SCHEME,
        message: errorMessage || ERROR_STATUES.MESSAGE_BLOCKED_BY_SCHEME.message,
      }

      throw new Error(errorMessage, { cause: errorCause })
    }

    return compilationResult.data
  }
}

export default ConversationSchemeService
