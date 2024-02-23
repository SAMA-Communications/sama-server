import BaseJSONController from './base.js'

import validate, { validateIsConversation } from '@sama/lib/validation.js'

import { CONSTANTS as MAIN_CONSTANTS } from '@sama/constants/constants.js'
import { ERROR_STATUES } from '@sama/constants/errors.js'
import ServiceLocatorContainer from '@sama/common/ServiceLocatorContainer.js'

import Message from '@sama/models/message.js'
import Conversation from '@sama/models/conversation.js'
import ConversationParticipant from '@sama/models/conversation_participant.js'

import sessionRepository from '@sama/repositories/session_repository.js'
import conversationRepository from '@sama/repositories/conversation_repository.js'

import DeliverMessage from '@sama/networking/models/DeliverMessage.js'
import Response from '@sama/networking/models/Response.js'

import { slice } from '@sama/utils/req_res_utils.js'

class ConversationsController extends BaseJSONController {
  async create(ws, data) {
    const { id: requestId, conversation_create: conversationParams } = data

    const conversationCreateOperation = ServiceLocatorContainer.use('ConversationCreateOperation')
    const { conversation, conversationCreatedMessageNotification } = await conversationCreateOperation.perform(ws, conversationParams)

    return new Response().addBackMessage({
      response: {
        id: requestId,
        conversation: conversation.visibleParams(),
      },
    }).addDeliverMessage(conversationCreatedMessageNotification)
  }

  async update(ws, data) {
    const { id: requestId, conversation_update: conversationParams } = data
  
    const conversationUpdateOperation = ServiceLocatorContainer.use('ConversationUpdateOperation')
    const updatedConversation = await conversationUpdateOperation.perform(ws, conversationParams)

    return new Response().addBackMessage({
      response: {
        id: requestId,
        conversation: updatedConversation.visibleParams(),
      },
    })
  }

  async list(ws, data) {
    const {
      id: requestId,
      conversation_list: { limit, updated_at },
    } = data

    const currentUser = sessionRepository.getSessionUserId(ws)
    const limitParam =
      limit > MAIN_CONSTANTS.LIMIT_MAX
        ? MAIN_CONSTANTS.LIMIT_MAX
        : limit || MAIN_CONSTANTS.LIMIT_MAX
    const userConversationsIds = await ConversationParticipant.findAll(
      {
        user_id: currentUser,
      },
      ['conversation_id']
    )

    const query = {
      _id: {
        $in: userConversationsIds.map((p) => p.conversation_id),
      },
    }
    const timeFromUpdate = updated_at
    if (timeFromUpdate && timeFromUpdate.gt) {
      query.updated_at = { $gt: new Date(timeFromUpdate.gt) }
    }

    const userConversations = await conversationRepository.findAll(
      query,
      null,
      limitParam
    )
    const lastMessagesListByCid = await Message.getLastMessageForConversation(
      userConversationsIds.map((el) => el.conversation_id),
      currentUser
    )

    const countOfUnreadMessagesByCid =
      await Message.getCountOfUnredMessagesByCid(
        userConversationsIds.map((el) => el.conversation_id),
        currentUser
      )

    for (const conv of userConversations) {
      const convId = conv._id.toString()
      conv['last_message'] = lastMessagesListByCid[convId]
      conv['unread_messages_count'] = countOfUnreadMessagesByCid[convId] || 0
    }

    return new Response().addBackMessage({
      response: {
        id: requestId,
        conversations: userConversations,
      },
    })
  }

  async delete(ws, data) {
    const {
      id: requestId,
      conversation_delete: { id: conversationId },
    } = data
    await validate(ws, { id: conversationId }, [validateIsConversation])

    const response = new Response()

    const conversation = await conversationRepository.findById(
      conversationId
    )

    const conversationParticipant = await ConversationParticipant.findOne({
      user_id: sessionRepository.getSessionUserId(ws),
      conversation_id: conversationId,
    })

    if (!conversationParticipant) {
      return response.addBackMessage({
        response: {
          id: requestId,
          error: ERROR_STATUES.PARTICIPANT_NOT_FOUND,
        },
      })
    }
    await conversationParticipant.delete()
    const existingUserInConversation = await ConversationParticipant.findOne({
      conversation_id: conversationId,
    })
    if (!existingUserInConversation) {
      await conversationRepository.delete(conversation._id)
    } else if (
      conversation.owner_id.toString() ===
        sessionRepository.getSessionUserId(ws) &&
      conversation.type !== 'u'
    ) {
      await conversationRepository.updateOne(conversationId, {
        owner_id: existingUserInConversation.params.user_id,
      })
    }

    return response.addBackMessage({ response: { id: requestId, success: true } })
  }

  async get_participants_by_cids(ws, data) {
    const {
      id: requestId,
      get_participants_by_cids: { cids, includes },
    } = data

    const userService = ServiceLocatorContainer.use('UserService')

    const response = new Response()

    const availableConversation = await ConversationParticipant.findAll({
      conversation_id: { $in: cids },
      user_id: sessionRepository.getSessionUserId(ws),
    })

    if (!availableConversation.length) {
      return response.addBackMessage({ response: { id: requestId, users: [] } })
    }

    const conversations = await Conversation.findAll(
      { _id: { $in: availableConversation.map((obj) => obj.conversation_id) } },
      ['type', 'opponent_id', 'owner_id'],
      null
    )

    const usersIds = []
    const convTypeGIds = []

    conversations.forEach((conv) => {
      if (conv.type === 'g') {
        convTypeGIds.push(conv._id)
        return
      }
      usersIds.push(conv.opponent_id, conv.owner_id.toString())
    })

    if (convTypeGIds.length) {
      const participants = await ConversationParticipant.findAll(
        {
          conversation_id: { $in: convTypeGIds },
        },
        ['user_id']
      )
      participants.forEach((u) => usersIds.push(u.user_id.toString()))
    }

    const pluckFields = includes ? ['_id'] : ['_id', 'first_name', 'last_name', 'login', 'email', 'phone']
    const retrieveUserIds = usersIds.filter((el, i) => usersIds.indexOf(el) === i)
    const users = await userService.userRepo.findAllByIds(retrieveUserIds)
    const usersLogin = users.map(user => slice(user.params, pluckFields, true))

    return response.addBackMessage({
      response: { id: requestId, users: usersLogin },
    })
  }
}

export default new ConversationsController()
