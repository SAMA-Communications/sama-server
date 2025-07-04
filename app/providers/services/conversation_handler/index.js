import { loadQuickJs } from "@sebastianwessel/quickjs"

import { ERROR_STATUES } from "../../../constants/errors.js"

class ConversationHandlerService {
  constructor(conversationHandlerRepo) {
    this.conversationHandlerRepo = conversationHandlerRepo
  }

  async runCodeViaSandbox(code, options) {
    const { runSandboxed } = await loadQuickJs()

    return await runSandboxed(async ({ evalCode }) => evalCode(code), options)
  }

  async createHandlerByConversationId(conversation_id, content, user_id) {
    await this.conversationHandlerRepo.create({ conversation_id, content, updated_by: user_id })
  }

  async updateExistedConversationHandler(conversation_id, content, user_id) {
    await this.conversationHandlerRepo.updateOne({ conversation_id }, { $set: { content, updated_by: user_id } })
  }

  async getHandlerByConversationId(conversation_id) {
    const record = await this.conversationHandlerRepo.findOne({ conversation_id })

    return record
  }

  async deleteConversationHandler(record_id) {
    await this.conversationHandlerRepo.deleteById(record_id)
  }

  async prepareAndExecuteConversationHandler(code, message, user) {
    const compilationResult = { accept: null, message: {}, options: {}, errorMessage: null }

    const options = {
      allowFetch: true,
      allowFs: false,
      executionTimeout: 3000,
      env: {
        MESSAGE: message,
        USER: user.params,
        ACCEPT: () => (compilationResult.accept = true),
        RESOLVE: (messageObject, options = {}) => {
          compilationResult.message = messageObject?.message || {}
          compilationResult.options = options
        },
        REJECT: (message) => (compilationResult.errorMessage = message),
        FETCH: async (input, init = {}) => {
          try {
            const res = await fetch(input, init)
            const data = await res.json()
            return {
              ok: res.ok,
              status: res.status,
              headers: res.headers,
              json: async () => data,
              text: async () => JSON.stringify(data),
            }
          } catch (e) {
            errorMessage = ERROR_STATUES.CORS_RESTRICTIONS
            return {
              ok: false,
              status: 500,
              json: async () => ({}),
              text: async () => "",
            }
          }
        },
      },
    }

    await this.runCodeViaSandbox(code, options)

    if (compilationResult.errorMessage) {
      const errorMessage = compilationResult.errorMessage || ERROR_STATUES.MESSAGE_BLOCKED_BY_HANDLER.message

      throw new Error(errorMessage, {
        cause: {
          ...ERROR_STATUES.MESSAGE_BLOCKED_BY_HANDLER,
          message: errorMessage,
        },
      })
    }
    console.log(compilationResult)

    return compilationResult
  }
}

export default ConversationHandlerService
