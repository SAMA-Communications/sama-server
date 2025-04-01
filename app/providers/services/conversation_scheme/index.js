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

  async runConversationScheme(message, user, resolve, reject) {}
}

export default ConversationSchemeService
