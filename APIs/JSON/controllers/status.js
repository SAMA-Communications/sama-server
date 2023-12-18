import BaseJSONController from './base.js'

import validate, { validateIsConversationByCID } from '@sama/lib/validation.js'
import { ACTIVE } from '@sama/store/session.js'
import Status from '@sama/models/status.js'
import ConversationParticipant from '@sama/models/conversation_participant.js'
import SessionRepository from '@sama/repositories/session_repository.js'
import ConversationParticipantsRepository from '@sama/repositories/conversation_participants_repository.js'
import Response from '@sama/networking/models/Response.js'

class StatusesController extends BaseJSONController {
  constructor() {
    super()

    this.sessionRepository = new SessionRepository(ACTIVE)
    this.conversationParticipantsRepository = new ConversationParticipantsRepository(ConversationParticipant)
  }

  async typing(ws, data) {
    const statusParams = data.typing

    await validate(ws, { cid: statusParams.cid }, [
      validateIsConversationByCID,
    ])

    statusParams.from = this.sessionRepository.getSessionUserId(ws)

    const status = new Status(statusParams)
    const currentTs = Math.round(Date.now() / 1000)
    status.params.t = parseInt(currentTs)

    const recipients = await this.conversationParticipantsRepository.findParticipantsByConversation(statusParams.cid)

    return new Response().addDeliverMessage({ packet: status, usersIds: recipients })
  }
}

export default new StatusesController()
