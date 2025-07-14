import { ERROR_STATUES } from "../../../constants/errors.js"

class ConversationService {
  constructor(
    CONVERSATION_MAX_PARTICIPANTS,

    helpers,
    storageService,
    conversationRepo,
    conversationParticipantRepo
  ) {
    this.CONVERSATION_MAX_PARTICIPANTS = CONVERSATION_MAX_PARTICIPANTS

    this.helpers = helpers
    this.storageService = storageService
    this.conversationRepo = conversationRepo
    this.conversationParticipantRepo = conversationParticipantRepo
  }

  async create(user, conversationParams, participantIds) {
    conversationParams.organization_id = user.organization_id
    conversationParams.owner_id = user.native_id

    const conversation = await this.conversationRepo.create(conversationParams)

    if (participantIds?.length) {
      await this.addParticipants(conversation, participantIds, true)
    }

    return conversation
  }

  async addImageUrl(conversations) {
    const imageUrlPromises = conversations.map(async (conv) => {
      if (conv.image_object) {
        ;(conv.params ? conv.params : conv)["image_url"] = await this.storageService.getFileDownloadUrl(
          conv.organization_id,
          conv.image_object.file_id
        )
      }
      return conv
    })

    return await Promise.all(imageUrlPromises)
  }

  async conversationsList(user, options, limit) {
    const filterOptions = {
      ...(options.updatedAt?.gt && { updatedAtFrom: new Date(options.updatedAt.gt) }),
      ...(options.updatedAt?.lt && { updatedAtTo: new Date(options.updatedAt.lt) }),
    }

    const conversationIds = await (options.ids?.length
      ? this.validateConvIdsWhichUserHasAccess(user.organization_id, options.ids, user.native_id)
      : this.conversationParticipantRepo.findParticipantConversations(user.native_id, filterOptions, limit))

    const conversations = await this.conversationRepo.list(user.organization_id, conversationIds, filterOptions, limit)

    return conversations
  }

  async restorePrivateConversation(conversation) {
    const requiredParticipantIds = [conversation.owner_id, conversation.opponent_id]

    const missedParticipantIds = await this.addParticipants(conversation, requiredParticipantIds)

    return missedParticipantIds
  }

  async findExistedPrivateConversation(userOwner, participantId) {
    const conversation = await this.conversationRepo.findExistedPrivateConversation(userOwner.native_id, participantId)

    return conversation
  }

  async findConversationParticipants(conversationId, full) {
    const participants = await this.conversationParticipantRepo.findConversationParticipants(conversationId)

    return full ? participants : participants.map((participant) => participant.user_id)
  }

  async *conversationParticipantIdsIterator(conversationId, exceptUserIds, batchSize = 100) {
    let lastObjectId = null

    const totalParticipants = await this.conversationParticipantRepo.countConversationParticipants(
      conversationId,
      exceptUserIds
    )

    const totalBatches = Math.ceil(totalParticipants / batchSize)

    for (let i = 0; i < totalBatches; i++) {
      const conversationParticipants = await this.conversationParticipantRepo.findConversationParticipants(
        conversationId,
        exceptUserIds,
        lastObjectId,
        batchSize
      )

      lastObjectId = conversationParticipants.at(-1)?._id

      const participantsIds = conversationParticipants.map((cParticipant) => cParticipant["user_id"])

      yield participantsIds
    }
  }

  async findConversationsParticipantIds(organizationId, conversationIds, userId) {
    const availableConversationIds = await this.validateConvIdsWhichUserHasAccess(
      organizationId,
      conversationIds,
      userId
    )

    const conversationsParticipants =
      await this.conversationParticipantRepo.findConversationsParticipants(availableConversationIds)

    const privateConversations = await this.conversationRepo.findAvailablePrivateConversation(
      availableConversationIds,
      userId
    )

    const allParticipantIdsFromPrivateConversation =
      await this.conversationParticipantRepo.extractParticipantIdsFromPrivateConversations(privateConversations)

    const participantIds = [
      ...new Set([...Object.values(conversationsParticipants).flat(), ...allParticipantIdsFromPrivateConversation]),
    ]

    return { participantIds, participantsIdsByCids: conversationsParticipants }
  }

  async findConversationsAdminIds(conversations) {
    const conversationIds = conversations.map((conversation) => conversation._id)
    const conversationsOwnersIds = conversations.reduce((acc, conversation) => {
      acc[conversation._id] = [conversation.owner_id]
      return acc
    }, {})

    const conversationsAdminsIds = await this.conversationParticipantRepo.findConversationsParticipants(
      conversationIds,
      "admin"
    )

    Object.keys(conversationsOwnersIds).forEach((conversationId) => {
      const adminsIds = conversationsAdminsIds[conversationId] ?? []
      conversationsOwnersIds[conversationId] = conversationsOwnersIds[conversationId].concat(adminsIds)
      delete conversationsAdminsIds[conversationId]
    })

    Object.assign(conversationsOwnersIds, conversationsAdminsIds)

    const adminIds = [...new Set([...Object.values(conversationsOwnersIds).flat()])]

    return { adminIds, adminIdsByCids: conversationsOwnersIds }
  }

  async validateConvIdsWhichUserHasAccess(organizationId, conversationIds, userId) {
    const verifiedConversationIds = await this.conversationParticipantRepo.filterAvailableConversationIds(
      conversationIds,
      userId
    )

    return verifiedConversationIds
  }

  async validateConvIdsWhichUserHasAccessAsAdmin(organizationId, conversationIds, userId) {
    const conversations = await this.conversationRepo.findByIdsWithOrgScope(organizationId, conversationIds)

    const { asOwner, left } = conversations.reduce(
      (acc, conversation) => {
        const isOwner = this.helpers.isEqualsNativeIds(conversation.owner_id, userId)
        isOwner ? acc.asOwner.push(conversation) : acc.left.push(conversation)
        return acc
      },
      { asOwner: [], left: [] }
    )

    if (!left.length) {
      return asOwner
    }

    const expectAdminConversationIds = left.map((conversation) => conversation._id)

    let verifiedConversationIds = await this.conversationParticipantRepo.filterAvailableConversationIds(
      expectAdminConversationIds,
      userId,
      "admin"
    )

    verifiedConversationIds = verifiedConversationIds.map((cId) => `${cId}`)

    const conversationsAsAdmin = left.filter((conversation) => verifiedConversationIds.includes(`${conversation._id}`))

    const verifiedConversations = asOwner.concat(conversationsAsAdmin)

    return verifiedConversations
  }

  async hasAccessToConversation(organizationId, conversationId, userId) {
    const result = { conversation: null, asParticipant: false, asOwner: false, asAdmin: false }

    result.conversation = await this.conversationRepo.findByIdWithOrgScope(organizationId, conversationId)

    if (!result.conversation) {
      return result
    }

    const currentParticipant = await this.conversationParticipantRepo.findFirstConversationParticipant(
      conversationId,
      userId
    )

    result.asParticipant = !!currentParticipant
    result.asAdmin = currentParticipant?.role === "admin"
    result.asOwner = this.helpers.isEqualsNativeIds(result.conversation.owner_id, userId)

    return result
  }

  async validateAccessToConversation(organizationId, conversationId, userId) {
    const { conversation, asOwner } = await this.hasAccessToConversation(organizationId, conversationId, userId)

    if (!conversation) {
      throw new Error(ERROR_STATUES.BAD_REQUEST.message, {
        cause: ERROR_STATUES.BAD_REQUEST,
      })
    }

    if (!asOwner) {
      throw new Error(ERROR_STATUES.FORBIDDEN.message, {
        cause: ERROR_STATUES.FORBIDDEN,
      })
    }
  }

  async updateParticipants(conversation, addParticipants, removeParticipants) {
    const addedIds = await this.addParticipants(conversation, addParticipants)

    const removeResult = await this.removeParticipants(conversation, removeParticipants)

    return { addedIds, ...removeResult }
  }

  async addParticipants(conversation, participantIds, isEmpty) {
    const currentParticipantsCount = isEmpty
      ? 0
      : conversation.type === "c"
        ? conversation.subscribers_count
        : await this.conversationParticipantRepo.countConversationParticipants(conversation._id)

    let participantsCount = participantIds.length + (currentParticipantsCount ?? 0)

    if (participantsCount > this.CONVERSATION_MAX_PARTICIPANTS) {
      throw new Error(ERROR_STATUES.PARTICIPANTS_LIMIT.message, {
        cause: ERROR_STATUES.PARTICIPANTS_LIMIT,
      })
    }

    if (participantIds.length) {
      const createParticipantsParams = participantIds.map((pId) => ({
        conversation_id: conversation._id,
        user_id: pId,
        organization_id: conversation.organization_id,
        role: this.helpers.isEqualsNativeIds(pId, conversation.owner_id) ? "owner" : null,
      }))

      participantIds = await this.conversationParticipantRepo.addNoExistedParticipants(
        conversation._id,
        createParticipantsParams
      )
    }

    participantsCount = (participantIds?.length ?? 0) + (currentParticipantsCount ?? 0)

    if (conversation.type === "c") {
      await this.conversationRepo.updateSubscribersCount(conversation._id, participantsCount)
      conversation.set("subscribers_count", participantsCount)
    }

    return participantIds
  }

  async removeParticipants(conversation, participantIds) {
    const result = { removedIds: null, newOwnerId: null, isEmptyAndDeleted: false }

    result.removedIds = await this.conversationParticipantRepo.removeExistedParticipants(
      conversation._id,
      participantIds
    )

    const firstConversationHasParticipant = await this.conversationParticipantRepo.findFirstConversationParticipant(
      conversation._id
    )

    if (!firstConversationHasParticipant) {
      await this.conversationRepo.deleteById(conversation._id)
      result.isEmptyAndDeleted = true
      return result
    }

    const isOwnerInRemove = result.removedIds.find((pId) => this.helpers.isEqualsNativeIds(pId, conversation.owner_id))

    if (isOwnerInRemove && conversation.type !== "u") {
      const newOwnerId = firstConversationHasParticipant.user_id
      await this.conversationRepo.updateOwner(conversation._id, newOwnerId)
      result.newOwnerId = newOwnerId
    }

    if (conversation.type === "c") {
      const subscribersCount = conversation.subscribers_count - result.removedIds.length
      await this.conversationRepo.updateSubscribersCount(conversation._id, subscribersCount)
      conversation.set("subscribers_count", subscribersCount)
    }

    return result
  }

  async participantsAddAdminRole(conversationId, participantsIds) {
    await this.conversationParticipantRepo.addAdminRole(conversationId, participantsIds)
  }

  async participantsRemoveAdminRole(conversationId, participantsIds) {
    await this.conversationParticipantRepo.removeAdminRole(conversationId, participantsIds)
  }
}

export default ConversationService
