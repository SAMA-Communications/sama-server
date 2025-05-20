import { ERROR_STATUES } from "../../../constants/errors"

class MessageService {
  constructor(helpers, userRepo, messageRepo, messageStatusRepo) {
    this.helpers = helpers
    this.userRepo = userRepo
    this.messageRepo = messageRepo
    this.messageStatusRepo = messageStatusRepo
  }

  async create(user, conversation, blockedUserIds, messageParams) {
    messageParams.cid = conversation._id
    messageParams.deleted_for = blockedUserIds
    messageParams.from = user.native_id
    messageParams.organization_id = user.organization_id

    messageParams.t = this.helpers.currentTimeStamp()

    const message = await this.messageRepo.create(messageParams)

    return message
  }

  #validateAttachmentInMessage(attachment) {
    const allowedAttachmentFields = this.messageRepo.Model.allowedAttachmentFields

    if (typeof attachment !== "object" || attachment === null) return false
    return Object.keys(attachment).every((key) => allowedAttachmentFields.includes(key))
  }

  async processHandlerResult(organizationId, accept, baseMessage, message, options) {
    if (accept) return {}

    const { body, attachments } = message
    const processedResponse = {}

    if (attachments?.length) {
      for (const att of attachments) {
        if (!this.#validateAttachmentInMessage(att)) {
          throw new Error(ERROR_STATUES.INVALID_ATTACHMENT_FIELDS.message, {
            cause: ERROR_STATUES.INVALID_ATTACHMENT_FIELDS,
          })
        }
      }
    }

    if (body && typeof body !== "string") {
      throw new Error(ERROR_STATUES.INCORRECT_TYPE_OF_BODY.message, {
        cause: ERROR_STATUES.INCORRECT_TYPE_OF_BODY,
      })
    }

    if (!body?.length && !attachments?.length) return processedResponse

    if (options.isReplaceBody) {
      processedResponse.newMessageFields = { body, attachments }
      return processedResponse
    }

    const existServerBot = await this.userRepo.findByLogin(organizationId, "server-chat-bot")
    if (existServerBot) {
      processedResponse.botMessageParams = { ...baseMessage, body, attachments }
      processedResponse.serverBot = existServerBot
    }

    return processedResponse
  }

  async messagesList(cId, user, options, limit) {
    const filterOptions = {}
    if (options.updatedAt?.gt) {
      filterOptions.updatedAtFrom = new Date(options.updatedAt.gt)
    }
    if (options.updatedAt?.lt) {
      filterOptions.updatedAtBefore = new Date(options.updatedAt.lt)
    }

    const messages = await this.messageRepo.list(cId, user.native_id, filterOptions, limit)

    const messageIds = messages.map((message) => message._id)

    const messagesStatuses = await this.messageStatusRepo.findReadStatusForMids(messageIds)

    return { messages, messagesStatuses }
  }

  async hasAccessToMessage(messageId, userId) {
    const result = { message: null, asOwner: false, selfDeleted: false }

    const message = await this.messageRepo.findById(messageId)

    if (!message) {
      return result
    }

    const deletedIds = message.deleted_for || []
    result.selfDeleted = deletedIds.includes(userId)

    if (result.selfDeleted) {
      return result
    }

    result.message = message

    result.asOwner = this.helpers.isEqualsNativeIds(message.from, userId)

    return result
  }

  async readMessagesInConversation(cid, user, mids) {
    const findMessagesOptions = { mids }
    if (!mids) {
      const lastReadMessagesByConvIds = await this.messageStatusRepo.findLastReadMessageByUserForCid(
        [cid],
        user.native_id
      )
      findMessagesOptions.lastReadMessageId = lastReadMessagesByConvIds[cid]?.mid || null
    }

    const unreadMessages = await this.messageRepo.findAllOpponentsMessagesFromConversation(
      cid,
      user.native_id,
      findMessagesOptions
    )

    if (unreadMessages.length) {
      const mids = unreadMessages.map((message) => message._id).reverse()

      await this.messageStatusRepo.upsertMessageReadStatuses(cid, mids, user.native_id, "read")
    }

    return unreadMessages
  }

  async aggregateLastMessageForConversation(cids, user) {
    const aggregateLastMessage = await this.messageRepo.findLastMessageForConversations(cids, user?.native_id)

    const lastMessagesIds = Object.values(aggregateLastMessage).map((msg) => msg._id)

    const aggregateLastMessageStatus = await this.messageStatusRepo.findReadStatusForMids(lastMessagesIds)

    Object.values(aggregateLastMessage).forEach((message) => {
      const status = aggregateLastMessageStatus[message._id.toString()] ? "read" : "sent"
      message.set("status", status)
    })

    return aggregateLastMessage
  }

  async aggregateCountOfUnreadMessagesByCid(cids, user) {
    const lastReadMessageByUserForCids = await this.messageStatusRepo.findLastReadMessageByUserForCid(
      cids,
      user.native_id
    )

    const unreadMessageCountByCids = await this.messageRepo.countUnreadMessagesByCids(
      cids,
      user.native_id,
      lastReadMessageByUserForCids
    )

    return unreadMessageCountByCids
  }

  async deleteMessages(userId, mIds, deleteAll) {
    if (deleteAll) {
      await this.messageRepo.deleteByIds(mIds)
    } else {
      await this.messageRepo.updateDeleteForUser(mIds, userId)
    }
  }
}

export default MessageService
