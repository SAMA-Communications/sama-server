import BaseRepository from "../base.js"
import { loadQuickJs } from "@sebastianwessel/quickjs"

class ConversationSchemeRepository extends BaseRepository {
  async prepareParams(params) {
    params.conversation_id = this.castObjectId(params.conversation_id)
    params.updated_by = this.castObjectId(params.updated_by)

    return await super.prepareParams(params)
  }

  async runCodeViaSandbox(code, options) {
    const { runSandboxed } = await loadQuickJs()

    return await runSandboxed(async ({ evalCode }) => evalCode(code), options)
  }
}

export default ConversationSchemeRepository
