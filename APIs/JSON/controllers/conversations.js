import BaseJSONController from './base.js'

import validate, {
  validateConversationsUserOwner,
  validateIsConversation,
  validateIsUserSendHimSelf,
  validateParticipantsInUType,
  validateParticipantsLimit,
} from '@sama/lib/validation.js'

import { CONSTANTS as MAIN_CONSTANTS } from '@sama/constants/constants.js'
import { CONSTANTS } from '../constants/constants.js'
import { ERROR_STATUES } from '@sama/constants/errors.js'

import User from '@sama/models/user.js'
import Message from '@sama/models/message.js'
import Conversation from '@sama/models/conversation.js'
import ConversationParticipant from '@sama/models/conversation_participant.js'

import sessionRepository from '@sama/repositories/session_repository.js'
import conversationRepository from '@sama/repositories/conversation_repository.js'

import conversationService from '../services/conversation.js'

import { ObjectId } from '@sama/lib/db.js'

import DeliverMessage from '@sama/networking/models/DeliverMessage.js'
import Response from '@sama/networking/models/Response.js'
import CreatePushEventOptions from '@sama/lib/push_queue/models/CreatePushEventOptions.js'

import getDisplayName from '../utils/get_display_name.js'

class ConversationsController extends BaseJSONController {
  async #notifyAboutConversationEvent(
    eventType,
    conversation,
    currentUserParams,
    recipients
  ) {
    const pushPayload = {
      title: conversation.name,
      body: `${getDisplayName(currentUserParams)} ${CONSTANTS.EVENT_TYPE_PARAMS[eventType].push_message_body}`,
    }

    const eventMessage = {
      event: { conversation_created: conversation },
    }
  
    const createPushEventOptions = new CreatePushEventOptions(currentUserParams._id, pushPayload, {})

    return new DeliverMessage(recipients, eventMessage).addPushQueueMessage(createPushEventOptions)
  }

  async #storeAndNotifyAboutParticipantAction(
    eventType,
    conversation,
    currentUserParams,
    actionUserParams,
    usersIdsForDelivery,
  ) {
    const messageInHistory = new Message({
      body: `${getDisplayName(actionUserParams)} ${CONSTANTS.ACTION_PARTICIPANT_MESSAGE[eventType]}`,
      cid: conversation._id,
      deleted_for: [],
      from: currentUserParams._id,
      t: parseInt(Math.round(Date.now() / 1000)),
      x: { type: eventType, user: actionUserParams },
    })

    await messageInHistory.save()

    const pushPayload = {
      title: `${getDisplayName(currentUserParams)} | ${conversation.name}`,
      body: messageInHistory.params.body,
      cid: messageInHistory.params.cid,
    }

    const messageForDelivery = { message: messageInHistory.visibleParams() }

    const createPushEventOptions = new CreatePushEventOptions(currentUserParams._id, pushPayload, {})
  
    const deliverMessage = new DeliverMessage(usersIdsForDelivery, messageForDelivery).addPushQueueMessage(createPushEventOptions)
    return new Response().addBackMessage(messageForDelivery).addDeliverMessage(deliverMessage)
  }

  async create(ws, data) {
    const { id: requestId, conversation_create: conversationParams } = data
    const currentUserId = sessionRepository.getSessionUserId(ws)
    const currentUserParams = (await User.findOne({ _id: currentUserId }))
      ?.params

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

      const existingConversation = await conversationRepository.findOne({
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

          const deliverMessage = await this.#notifyAboutConversationEvent(
            CONSTANTS.CONVERSATION_EVENT.CREATE,
            existingConversation,
            currentUserParams,
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
    const deliverMessage = await this.#notifyAboutConversationEvent(
      CONSTANTS.CONVERSATION_EVENT.CREATE,
      convParams,
      currentUserParams,
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

    const currentUserId = sessionRepository.getSessionUserId(ws)
    const conversationId = requestData.id
    const conversation = await conversationRepository.findById(
      conversationId
    )
    await validate(ws, conversation, [validateConversationsUserOwner])

    delete requestData.id

    const response = new Response()

    let isOwnerChange = false
    if (
      conversation.type !== 'u' &&
      requestData.participants &&
      Object.keys(requestData.participants) != 0
    ) {
      const participantsToUpdate = requestData.participants
      delete requestData.participants

      const { add: addUsers, remove: removeUsers } = participantsToUpdate
      const countParticipants = await ConversationParticipant.count({
        conversation_id: conversationId,
      })

      const currentUserParams = (await User.findOne({ _id: currentUserId }))
        ?.params

      let existingParticipantsIds = (
        await ConversationParticipant.findAll(
          { conversation_id: conversationId },
          ['user_id']
        )
      ).map((p) => p.user_id.toString())

      const { newParticipantsIds, newParticipantsInfo } = addUsers?.length
        ? await conversationService.getNewParticipantsParams(
            existingParticipantsIds,
            addUsers
          )
        : {}

      const { removeParticipantsIds, removeParticipantsInfo } =
        removeUsers?.length
          ? await conversationService.getRemoveParticipantsParams(
              existingParticipantsIds,
              removeUsers
            )
          : {}

      if (addUsers && newParticipantsIds.length) {
        await validate(ws, countParticipants + addUsers.length, [
          validateParticipantsLimit,
        ])

        const participantSavePromises = newParticipantsInfo.map(async (u) => {
          const participant = new ConversationParticipant({
            user_id: ObjectId(u._id),
            conversation_id: ObjectId(conversationId),
          })
          await participant.save()

          const actionResponse = await this.#storeAndNotifyAboutParticipantAction(
            'added_participant',
            conversation,
            currentUserParams,
            u,
            null,
          )

          response.merge(actionResponse)
        })

        await Promise.all(participantSavePromises)

        const convObjectId = conversation._id
        conversation['last_message'] = (
          await Message.getLastMessageForConversation(
            [convObjectId],
            currentUserId
          )
        )[convObjectId]
        conversation['unread_messages_count'] = 1

        const actionDeliverMessage = await this.#notifyAboutConversationEvent(
          CONSTANTS.CONVERSATION_EVENT.UPDATE,
          conversation,
          currentUserParams,
          newParticipantsIds
        )

        response.addDeliverMessage(actionDeliverMessage)
      }

      if (removeUsers && removeParticipantsIds.length) {
        const participantRemovePromises = removeParticipantsInfo.map(
          async (u) => {
            const uStringId = u._id.toString()
            isOwnerChange = conversation.owner_id.toString() === uStringId

            const participantObj = await ConversationParticipant.findOne({
              user_id: u._id,
              conversation_id: conversationId,
            })
            await participantObj.delete()

            existingParticipantsIds = existingParticipantsIds.filter(
              (uId) => uId !== uStringId
            )

            const actionResponse = await this.#storeAndNotifyAboutParticipantAction(
              'removed_participant',
              conversation,
              currentUserParams,
              u,
              existingParticipantsIds,
            )

            response.merge(actionResponse)
          }
        )

        await Promise.all(participantRemovePromises)

        const deliverMessage = await this.#notifyAboutConversationEvent(
          CONSTANTS.CONVERSATION_EVENT.DELETE,
          conversation,
          currentUserParams,
          removeParticipantsIds
        )

        response.addDeliverMessage(deliverMessage)
      }
    }

    if (isOwnerChange) {
      const isUserInConversation = await ConversationParticipant.findOne({
        conversation_id: conversationId,
      })
      requestData.owner_id = isUserInConversation.params.user_id
    }

    isOwnerChange = false

    if (Object.keys(requestData) != 0) {
      await conversationRepository.updateOne(conversationId, requestData)
    }

    const returnConversation = await conversationRepository.findById(
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
