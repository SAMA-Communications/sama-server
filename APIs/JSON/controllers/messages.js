import BaseJSONController from './base.js'

import validate, {
  validateIsConversation,
  validateIsConversationByCID,
  validateIsUserAccess,
  validateIsUserHasPermission,
} from '@sama/lib/validation.js'

import { CONSTANTS } from '@sama/constants/constants.js'
import { ERROR_STATUES } from '@sama/constants/errors.js'

import {
  inMemoryBlockList,
  inMemoryConversations,
} from '@sama/store/in_memory.js'
import { ACTIVE } from '@sama/store/session.js'

import User from '@sama/models/user.js'
import Message from '@sama/models/message.js'
import MessageStatus from '@sama/models/message_status.js'
import BlockedUser from '@sama/models/blocked_user.js'
import Conversation from '@sama/models/conversation.js'

import ConversationRepository from '@sama/repositories/conversation_repository.js'
import ConversationParticipant from '@sama/models/conversation_participant.js'
import ConversationParticipantsRepository from '@sama/repositories/conversation_participants_repository.js'
import BlockListRepository from '@sama/repositories/blocklist_repository.js'
import PushNotificationsRepository from '../repositories/push_notifications_repository.js'
import SessionRepository from '@sama/repositories/session_repository.js'

import { ObjectId } from '@sama/lib/db.js'

import Response from '@sama/networking/models/Response.js'

import groupBy from '../utils/groupBy.js'


class MessagesController extends BaseJSONController {
  constructor() {
    super()
    this.pushNotificationsRepository = new PushNotificationsRepository()
    this.conversationRepository = new ConversationRepository(
      Conversation,
      inMemoryConversations
    )
    this.conversationParticipantsRepository = new ConversationParticipantsRepository(ConversationParticipant)
    this.blockListRepository = new BlockListRepository(
      BlockedUser,
      inMemoryBlockList
    )
    this.sessionRepository = new SessionRepository(ACTIVE)
  }

  async create(ws, data) {
    const { message: messageParams } = data
    const messageId = messageParams.id

    const response = new Response()

    const currentUserId = this.sessionRepository.getSessionUserId(ws)
    const conversation = await this.conversationRepository.findById(
      messageParams.cid
    )

    let participants
    if (!conversation) {
      throw new Error(ERROR_STATUES.CONVERSATION_NOT_FOUND.message, {
        cause: ERROR_STATUES.CONVERSATION_NOT_FOUND,
      })
    }
    participants = await ConversationParticipant.findAll({
      conversation_id: conversation._id,
    })
    participants = participants?.map((u) => u.user_id.toString())
    if (!participants.includes(currentUserId)) {
      throw new Error(ERROR_STATUES.FORBIDDEN.message, {
        cause: ERROR_STATUES.FORBIDDEN,
      })
    }

    const blockedUsersIds = await this.blockListRepository.getBlockingUsers(
      currentUserId,
      participants
    )

    if (conversation.type === 'u' && blockedUsersIds.length) {
      throw new Error(ERROR_STATUES.USER_BLOCKED.message, {
        cause: ERROR_STATUES.USER_BLOCKED,
      })
    }
    if (
      conversation.type === 'g' &&
      blockedUsersIds.length === participants.length - 1
    ) {
      throw new Error(ERROR_STATUES.USER_BLOCKED_FOR_ALL_PARTICIPANTS.message, {
        cause: ERROR_STATUES.USER_BLOCKED_FOR_ALL_PARTICIPANTS,
      })
    }

    messageParams.deleted_for = blockedUsersIds
    messageParams.from = ObjectId(currentUserId)

    const message = new Message(messageParams)
    message.params.cid = message.params.cid
      ? ObjectId(message.params.cid)
      : message.params.cid
    const currentTs = Math.round(Date.now() / 1000)
    message.params.t = parseInt(currentTs)

    await message.save()

    if (conversation.type === 'u') {
      const recipientsThatChatNotVisible = [
        conversation.opponent_id,
        conversation.owner_id.toString(),
      ].filter((u) => !participants.includes(u))

      if (recipientsThatChatNotVisible.length) {
        for (let userId of recipientsThatChatNotVisible) {
          const participant = new ConversationParticipant({
            user_id: ObjectId(userId),
            conversation_id: conversation._id,
          })
          await participant.save()
        }

        const eventMessage = {
          event: { conversation_created: conversation },
          id: messageId,
        }

        response.addDeliverMessage({ packet: eventMessage, userIds: recipientsThatChatNotVisible })
      }
    }

    const userLogin = (await User.findOne({ _id: currentUserId }))?.params
      ?.login
    const firstAttachmentUrl = !messageParams.attachments?.length
      ? null
      : await globalThis.storageClient.getDownloadUrl(
          messageParams.attachments[0].file_id
        )

    const pushPayload = Object.assign({
      title:
        conversation.type === 'u'
          ? userLogin
          : `${userLogin} | ${conversation.name}`,
      body: messageParams.body,
      firstAttachmentUrl,
      cid: messageParams.cid,
    })

    const pushMessage = { message: message.visibleParams() }
    const recipients = await this.conversationParticipantsRepository.findParticipantsByConversation(messageParams.cid)

    await this.pushNotificationsRepository.addPushNotificationToQueueIfUsersOffline(recipients, pushPayload)
    
    response.addDeliverMessage({ packet: pushMessage, userIds: recipients })

    await this.conversationRepository.updateOne(messageParams.cid, {
      updated_at: message.params.created_at,
    })

    return response.addBackMessage({
      ask: { mid: messageId, server_mid: message.params._id, t: currentTs },
    })
  }

  async edit(ws, data) {
    const { id: requestId, message_edit: messageParams } = data
    const messageId = messageParams.id

    let message = await Message.findOne({ _id: messageId })

    if (!message) {
      throw new Error(ERROR_STATUES.MESSAGE_ID_NOT_FOUND.message, {
        cause: ERROR_STATUES.MESSAGE_ID_NOT_FOUND,
      })
    }
  
    await validate(ws, message.params, [validateIsUserAccess])

    await Message.updateOne(
      { _id: messageId },
      { $set: { body: messageParams.body } }
    )
    const request = {
      message_edit: {
        id: messageId,
        body: messageParams.body,
        from: ObjectId(this.sessionRepository.getSessionUserId(ws)),
      },
    }
    const recipients = await this.conversationParticipantsRepository.findParticipantsByConversation(messageParams.cid)

    return new Response()
      .addBackMessage({ response: { id: requestId, success: true } })
      .addDeliverMessage({ packet: request, userIds: recipients, notSaveInOfflineStorage: true })
  }

  async list(ws, data) {
    const {
      id: requestId,
      message_list: { cid, limit, updated_at },
    } = data

    const currentUserId = this.sessionRepository.getSessionUserId(ws)

    await validate(ws, { id: cid, cid, uId: currentUserId }, [
      validateIsConversation,
      validateIsUserHasPermission,
    ])

    const limitParam =
      limit > CONSTANTS.LIMIT_MAX
        ? CONSTANTS.LIMIT_MAX
        : limit || CONSTANTS.LIMIT_MAX

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

    const uId = this.sessionRepository.getSessionUserId(ws)

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

        response.addDeliverMessage({ packet: message, userIds: Object.keys(unreadMessagesGroupedByFrom) })
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
          from: ObjectId(this.sessionRepository.getSessionUserId(ws)),
        },
      }

      const recipients = await this.conversationParticipantsRepository.findParticipantsByConversation(cid)
      response.addDeliverMessage({ packet: request, userIds: recipients, notSaveInOfflineStorage: true })
      await Message.deleteMany({ _id: { $in: ids } })
    } else {
      await Message.updateMany(
        { id: { $in: ids } },
        {
          $addToSet: {
            deleted_for: ObjectId(this.sessionRepository.getSessionUserId(ws)),
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
