import BaseJSONController from './base.js'

import validate, { validateIsConversationByCID } from '@sama/lib/validation.js'

import Status from '@sama/models/status.js'

import sessionRepository from '@sama/repositories/session_repository.js'
import conversationParticipantsRepository from '@sama/repositories/conversation_participants_repository.js'

import DeliverMessage from '@sama/networking/models/DeliverMessage.js'
import Response from '@sama/networking/models/Response.js'

class StatusesController extends BaseJSONController {
  async typing(ws, data) {
    const statusParams = data.typing

    await validate(ws, { cid: statusParams.cid }, [
      validateIsConversationByCID,
    ])

    statusParams.from = sessionRepository.getSessionUserId(ws)

    const status = new Status(statusParams)
    const currentTs = Math.round(Date.now() / 1000)
    status.params.t = parseInt(currentTs)

    const recipients = await conversationParticipantsRepository.findParticipantsByConversation(statusParams.cid)

    return new Response().addDeliverMessage(new DeliverMessage(recipients, status))
  }
}

export default new StatusesController()
