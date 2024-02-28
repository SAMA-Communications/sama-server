import BaseJSONController from './base.js'

import validate, {
  validateIsConversation,
  validateIsConversationByCID,
  validateIsUserHasPermission,
} from '@sama/lib/validation.js'

import { CONSTANTS as MAIN_CONSTANTS } from '@sama/constants/constants.js'

import ServiceLocatorContainer from '@sama/common/ServiceLocatorContainer.js'

import Message from '@sama/models/message.js'
import MessageStatus from '@sama/models/message_status.js'

import conversationParticipantsRepository from '@sama/repositories/conversation_participants_repository.js'
import sessionRepository from '@sama/repositories/session_repository.js'

import { ObjectId } from '@sama/lib/db.js'

import DeliverMessage from '@sama/networking/models/DeliverMessage.js'
import Response from '@sama/networking/models/Response.js'

import groupBy from '../utils/groupBy.js'


class MessagesController extends BaseJSONController {
  async create(ws, data) {
    const { message: messageParams } = data

    const messageCreateOperation = ServiceLocatorContainer.use('MessageCreateOperation')
    const { messageId, message, deliverMessages } = await messageCreateOperation.perform(ws, messageParams)

    return new Response().addBackMessage({
      ask: { mid: messageId, server_mid: message.params._id, t: message.params.t },
    }).addDeliverMessage(...deliverMessages)
  }

  async edit(ws, data) {
    const { id: requestId, message_edit: messageParams } = data

    const messageEditOperation = ServiceLocatorContainer.use('MessageEditOperation')
    const { messageId, body, from, participantId } = await messageEditOperation.perform(ws, messageParams)

    return new Response()
      .addBackMessage({ response: { id: requestId, success: true } })
      .addDeliverMessage(new DeliverMessage( participantId, {
          message_edit: {
            id: messageId,
            body: body,
            from: from,
          }
        }, true)
      )
  }

  async list(ws, data) {
    const {
      id: requestId,
      message_list: { cid, limit, updated_at },
    } = data

    const currentUserId = sessionRepository.getSessionUserId(ws)

    await validate(ws, { id: cid, cid, uId: currentUserId }, [
      validateIsConversation,
      validateIsUserHasPermission,
    ])

    const limitParam =
      limit > MAIN_CONSTANTS.LIMIT_MAX
        ? MAIN_CONSTANTS.LIMIT_MAX
        : limit || MAIN_CONSTANTS.LIMIT_MAX

    const query = {
      cid,
      deleted_for: { $nin: [currentUserId] },
    }
    const timeFromUpdate = updated_at
    if (timeFromUpdate) {
      timeFromUpdate.gt &&
        (query.updated_at = { $gt: new Date(timeFromUpdate.gt) })
      timeFromUpdate.lt &&
        (query.updated_at = { $lt: new Date(timeFromUpdate.lt) })
    }

    const messages = await Message.findAll(
      query,
      Message.visibleFields,
      limitParam
    )
    const messagesStatus = await MessageStatus.getReadStatusForMids(
      messages.map((msg) => msg._id)
    )

    return new Response().addBackMessage({
      response: {
        id: requestId,
        messages: messages.map((msg) => {
          if (msg.from.toString() === currentUserId) {
            msg['status'] = messagesStatus[msg._id]?.length ? 'read' : 'sent'
          }
          return msg
        }),
      },
    })
  }

  async read(ws, data) {
    const {
      id: requestId,
      message_read: { cid, ids: mids },
    } = data
    
    const response = new Response()

    const uId = sessionRepository.getSessionUserId(ws)

    const query = { cid, user_id: uId }
    const filters = { cid, from: { $ne: uId } }
    if (mids) {
      filters._id = { $in: mids }
    } else {
      const lastReadMessage = (
        await MessageStatus.findAll(query, ['mid'], 1)
      )[0]
      if (lastReadMessage) {
        filters._id = { $gt: lastReadMessage.mid }
      }
    }

    const unreadMessages = await Message.findAll(filters)

    if (unreadMessages.length) {
      const insertMessages = unreadMessages.map((msg) => {
        return {
          cid: ObjectId(cid),
          mid: ObjectId(msg._id),
          user_id: ObjectId(uId),
          status: 'read',
        }
      })
    
      await MessageStatus.insertMany(insertMessages.reverse())
      const unreadMessagesGroupedByFrom = groupBy(unreadMessages, 'from')

      for (const uId in unreadMessagesGroupedByFrom) {
        const mids = unreadMessagesGroupedByFrom[uId].map((el) => el._id)
        const message = {
          message_read: {
            cid: ObjectId(cid),
            ids: mids,
            from: ObjectId(uId),
          },
        }

        response.addDeliverMessage(new DeliverMessage(Object.keys(unreadMessagesGroupedByFrom), message))
      }
    }

    return response.addBackMessage({
      response: {
        id: requestId,
        success: true,
      },
    })
  }

  async delete(ws, data) {
    const {
      id: requestId,
      message_delete: { type, cid, ids },
    } = data
    await validate(ws, { cid }, [validateIsConversationByCID])

    const response = new Response()

    if (type == 'all') {
      const request = {
        message_delete: {
          cid,
          ids,
          type: 'all',
          from: ObjectId(sessionRepository.getSessionUserId(ws)),
        },
      }

      const recipients = await conversationParticipantsRepository.findParticipantsByConversation(cid)
      response.addDeliverMessage(new DeliverMessage(recipients, request, true))
      await Message.deleteMany({ _id: { $in: ids } })
    } else {
      await Message.updateMany(
        { id: { $in: ids } },
        {
          $addToSet: {
            deleted_for: ObjectId(sessionRepository.getSessionUserId(ws)),
          },
        }
      )
    }

    return response.addBackMessage({
      response: {
        id: requestId,
        success: true,
      },
    })
  }
}

export default new MessagesController()
