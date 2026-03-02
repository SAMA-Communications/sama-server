import { google } from "@ai-sdk/google"
import { generateText } from "ai"

import { ERROR_STATUES } from "../../../../constants/errors.js"
import { CONSTANTS as MAIN_CONSTANTS } from "../../../../constants/constants.js"

class MessageToneOperation {
  constructor(config, logger, messageService) {
    this.config = config
    this.logger = logger
    this.messageService = messageService
  }

  async perform(ws, messageSummaryParams) {
    const { body, tone } = messageSummaryParams

    try {
      const result = await generateText({
        model: google(this.config.get("googleAI.model")),
        prompt: `Rewrite the text "${body}" in ${tone} tone.` + MAIN_CONSTANTS.MESSAGE_TONE_AI_PROMPT,
      })
      return { message: result.text }
    } catch (err) {
      this.logger.error(err, "[error]")
      throw new Error(ERROR_STATUES.AI_AGENT_ERROR.message, {
        cause: ERROR_STATUES.AI_AGENT_ERROR,
      })
    }
  }
}

export default MessageToneOperation
