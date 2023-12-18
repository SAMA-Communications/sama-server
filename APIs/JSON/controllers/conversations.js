import BaseJSONController from './base.js'

import validate, {
  validateConversationsUserOwner,
  validateIsConversation,
  validateIsUserSendHimSelf,
  validateParticipantsInUType,
  validateParticipantsLimit,
} from '@sama/lib/validation.js'

import { CONSTANTS } from '@sama/constants/constants.js'
import { ERROR_STATUES } from '@sama/constants/errors.js'

import { ACTIVE } from '@sama/store/session.js'
import { inMemoryConversations } from '@sama/store/in_memory.js'

import User from '@sama/models/user.js'
import Conversation from '@sama/models/conversation.js'
import Message from '@sama/models/message.js'

import SessionRepository from '@sama/repositories/session_repository.js'
import ConversationParticipant from '@sama/models/conversation_participant.js'
import ConversationRepository from '@sama/repositories/conversation_repository.js'
import PushNotificationsRepository from '../repositories/push_notifications_repository.js'

import { ObjectId } from '@sama/lib/db.js'

import Response from '@sama/networking/models/Response.js'

class ConversationsController extends BaseJSONController {
  constructor() {
    super()
    this.pushNotificationsRepository = new PushNotificationsRepository()
    this.conversationRepository = new ConversationRepository(
      Conversation,
      inMemoryConversations
    )
    this.sessionRepository = new SessionRepository(ACTIVE)
  }

  async #notifyAboutConversationCreate(
    ws,
    conversation,
    currentUserLogin,
    recipients
  ) {
    const pushMessage = {
      title: conversation.name,
      body: `${currentUserLogin} created a new conversation`,
    }

    const eventMessage = {
      event: { conversation_created: conversation },
    }

    await this.pushNotificationsRepository.addPushNotificationToQueueIfUsersOffline(recipients, pushMessage)
  
    return { packet: eventMessage, userIds: recipients }
  }

  async #notifyAboutConversationUpdate(
    ws,
    conversation,
    currentUserLogin,
    recipients
  ) {
    const pushMessage = {
      title: conversation.name,
      body: `${currentUserLogin} added you to conversation`,
    }

    const eventMessage = {
      event: { conversation_created: conversation },
    }

    await this.pushNotificationsRepository.addPushNotificationToQueueIfUsersOffline(recipients, pushMessage)
  
    return { packet: eventMessage, userIds: recipients }
  }

  async create(ws, data) {
    const { id: requestId, conversation_create: conversationParams } = data
    const currentUserId = this.sessionRepository.getSessionUserId(ws)
    const currentUserLogin = (await User.findOne({ _id: currentUserId }))
      ?.params?.login

    const participants = await User.getAllIdsBy({
      _id: { $in: conversationParams.participants },
    })
    delete conversationParams.participants
    conversationParams.owner_id = ObjectId(currentUserId)

    const response = new Response()

    if (conversationParams.type == 'u') {
      const opponentId = (conversationParams.opponent_id = String(
        participants[0]
      ))
      await validate(ws, { participants, opponent_id: opponentId }, [
        validateParticipantsInUType,
        validateIsUserSendHimSelf,
      ])

      const existingConversation = await this.conversationRepository.findOne({
        $or: [
          {
            type: 'u',
            owner_id: ObjectId(currentUserId),
            opponent_id: opponentId,
          },
          {
            type: 'u',
            owner_id: ObjectId(opponentId),
            opponent_id: currentUserId,
          },
        ],
      })

      if (existingConversation) {
        const existingParticipants = await ConversationParticipant.findAll({
          conversation_id: existingConversation._id,
        })
        if (existingParticipants.length !== 2) {
          const requiredParticipantsIds = [currentUserId, opponentId]
          const existingParticipantsIds = existingParticipants.map((u) =>
            u.user_id.toString()
          )

          const missedParticipantId = requiredParticipantsIds.filter(
            (uId) => !existingParticipantsIds.includes(uId)
          )[0]

          const participant = new ConversationParticipant({
            user_id: ObjectId(missedParticipantId),
            conversation_id: existingConversation._id,
          })
          await participant.save()

          const deliverMessage = await this.#notifyAboutConversationCreate(
            ws,
            existingConversation,
            currentUserLogin,
            [missedParticipantId]
          )

          response.addDeliverMessage(deliverMessage)
        }
        return response.addBackMessage({
          response: {
            id: requestId,
            conversation: existingConversation,
          },
        })
      }
    }

    const isOwnerInArray = participants.some(
      (el) => JSON.stringify(el) === JSON.stringify(conversationParams.owner_id)
    )
    if (!isOwnerInArray) {
      participants.push(ObjectId(conversationParams.owner_id))
    } else if (participants.length === 1) {
      return response.addBackMessage({
        response: {
          id: requestId,
          error: ERROR_STATUES.PARTICIPANTS_NOT_PROVIDED,
        },
      })
    }

    const conversationObj = new Conversation(conversationParams)
    await conversationObj.save()

    for (const userId of participants) {
      const participant = new ConversationParticipant({
        user_id: userId,
        conversation_id: conversationObj.params._id,
      })
      await participant.save()
    }

    const convParams = conversationObj.visibleParams()
    const deliverMessage = await this.#notifyAboutConversationCreate(
      ws,
      convParams,
      currentUserLogin,
      participants
    )

    return response.addBackMessage({
      response: {
        id: requestId,
        conversation: conversationObj.visibleParams(),
      },
    }).addDeliverMessage(deliverMessage)
  }

  async update(ws, data) {
    const { id: requestId, conversation_update: requestData } = data
    await validate(ws, requestData, [validateIsConversation])

    const currentUserId = this.sessionRepository.getSessionUserId(ws)
    const conversationId = requestData.id
    const conversation = await this.conversationRepository.findById(
      conversationId
    )
    await validate(ws, conversation, [validateConversationsUserOwner])

    delete requestData.id

    const response = new Response()

    let isOwnerChange = false
    if (
      requestData.participants &&
      Object.keys(requestData.participants) != 0
    ) {
      const participantsToUpdate = requestData.participants
      delete requestData.participants

      const { add: addUsers, remove: removeUsers } = participantsToUpdate
      const countParticipants = await ConversationParticipant.count({
        conversation_id: conversationId,
      })
      if (addUsers) {
        await validate(ws, countParticipants + addUsers.length, [
          validateParticipantsLimit,
        ])

        const participants = []
        for (const addUser of addUsers) {
          const participant = new ConversationParticipant({
            user_id: ObjectId(addUser),
            conversation_id: ObjectId(conversationId),
          })
          if (
            !(await ConversationParticipant.findOne({
              user_id: addUser,
              conversation_id: conversationId,
            }))
          ) {
            await participant.save()
            participants.push(participant.params._id)
          }
        }

        if (participants.length && conversation.type !== 'u') {
          const currentUserLogin = (await User.findOne({ _id: currentUserId }))
            ?.params?.login
          const deliverMessage = await this.#notifyAboutConversationUpdate(
            ws,
            conversation,
            currentUserLogin,
            participants
          )

          response.addDeliverMessage(deliverMessage)
        }
      }

      if (removeUsers) {
        for (const removeUser of removeUsers) {
          const obj = await ConversationParticipant.findOne({
            user_id: removeUser,
            conversation_id: conversationId,
          })
          if (!!obj) {
            if (
              conversation.owner_id.toString() === obj.params.user_id.toString()
            ) {
              isOwnerChange = true
            }
            await obj.delete()
          }
        }
      }
    }
    if (isOwnerChange) {
      const isUserInConvesation = await ConversationParticipant.findOne({
        conversation_id: conversationId,
      })
      requestData.owner_id = isUserInConvesation.params.user_id
    }
    isOwnerChange = false
    if (Object.keys(requestData) != 0) {
      await this.conversationRepository.updateOne(conversationId, requestData)
    }

    const returnConversation = await this.conversationRepository.findById(
      conversationId
    )

    return response.addBackMessage({
      response: {
        id: requestId,
        conversation: returnConversation,
      },
    })
  }

  async list(ws, data) {
    const {
      id: requestId,
      conversation_list: { limit, updated_at },
    } = data

    const currentUser = this.sessionRepository.getSessionUserId(ws)
    const limitParam =
      limit > CONSTANTS.LIMIT_MAX
        ? CONSTANTS.LIMIT_MAX
        : limit || CONSTANTS.LIMIT_MAX
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

    const userConversations = await this.conversationRepository.findAll(
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

    const conversation = await this.conversationRepository.findById(
      conversationId
    )

    const conversationParticipant = await ConversationParticipant.findOne({
      user_id: this.sessionRepository.getSessionUserId(ws),
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
      await this.conversationRepository.delete(conversation._id)
    } else if (
      conversation.owner_id.toString() ===
        this.sessionRepository.getSessionUserId(ws) &&
      conversation.type !== 'u'
    ) {
      await this.conversationRepository.updateOne(conversationId, {
        owner_id: existingUserInConversation.params.user_id,
      })
    }

    return new response.addBackMessage({ response: { id: requestId, success: true } })
  }

  async get_participants_by_cids(ws, data) {
    const {
      id: requestId,
      get_participants_by_cids: { cids, includes },
    } = data

    const response = new Response()

    const availableConversation = await ConversationParticipant.findAll({
      conversation_id: { $in: cids },
      user_id: this.sessionRepository.getSessionUserId(ws),
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

    const usersLogin = await User.findAll(
      {
        _id: { $in: usersIds.filter((el, i) => usersIds.indexOf(el) === i) },
      },
      includes
        ? ['_id']
        : ['_id', 'first_name', 'last_name', 'login', 'email', 'phone'],
      null
    )

    return response.addBackMessage({
      response: { id: requestId, users: usersLogin },
    })
  }
}

export default new ConversationsController()
