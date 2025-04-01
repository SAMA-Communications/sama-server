import BaseRepository from "../base.js"

class ConversationSchemeRepository extends BaseRepository {
  async prepareParams(params) {
    params.conversation_id = this.castObjectId(params.conversation_id)
    params.updated_by = this.castObjectId(params.updated_by)

    return await super.prepareParams(params)
  }
}

export default ConversationSchemeRepository
