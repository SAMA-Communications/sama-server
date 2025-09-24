import { google } from "@ai-sdk/google"
import { generateText } from "ai"

import { ERROR_STATUES } from "../../../../constants/errors.js"
import { CONSTANTS as MAIN_CONSTANTS } from "../../../../constants/constants.js"

class MessageToneOperation {
  constructor(messageService) {
    this.messageService = messageService
  }

  async perform(ws, messageSummaryParams) {
    const { body, tone } = messageSummaryParams

    let returnMessage

    try {
      const result = await generateText({
        model: google(process.env.GOOGLE_GENERATIVE_AI_MODEL),
        prompt: `Rewrite the text "${body}" in ${tone} tone.` + MAIN_CONSTANTS.MESSAGE_TONE_AI_PROMPT,
      })
      returnMessage = result.text
    } catch (err) {
      console.error("[ai.agent.error]:", err)
      throw new Error(ERROR_STATUES.AI_AGENT_ERROR.message, {
        cause: ERROR_STATUES.AI_AGENT_ERROR,
      })
    }

    return { message: returnMessage }
  }
}

export default MessageToneOperation
