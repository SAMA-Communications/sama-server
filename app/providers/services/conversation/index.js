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
    conversationParams.owner_id = user.native_id
    conversationParams.organization_id = user.organization_id

    const conversation = await this.conversationRepo.create(conversationParams)

    if (participantIds?.length) {
      await this.addParticipants(conversation, participantIds, [])
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

  async restorePrivateConversation(conversation, currentParticipantIds) {
    const requiredParticipantIds = [conversation.owner_id, conversation.opponent_id]

    const missedParticipantIds = await this.addParticipants(conversation, requiredParticipantIds, currentParticipantIds)

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
    const result = { conversation: null, asParticipant: false, asOwner: false, participantIds: null }

    result.conversation = await this.conversationRepo.findByIdWithOrgScope(organizationId, conversationId)

    if (!result.conversation) {
      return result
    }

    const participants = await this.findConversationParticipants(conversationId, true)
    const currentParticipant = participants.find((p) => this.helpers.isEqualsNativeIds(p.user_id, userId))

    result.asParticipant = !!currentParticipant
    result.asAdmin = currentParticipant?.role === "admin"
    result.asOwner = this.helpers.isEqualsNativeIds(result.conversation.owner_id, userId)
    result.participantIds = participants.map((p) => p.user_id)

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

  async updateParticipants(conversation, addParticipants, removeParticipants, currentParticipantIds) {
    if (!currentParticipantIds) {
      currentParticipantIds = await this.findConversationParticipants(conversation._id)
    }

    const addedIds = await this.addParticipants(conversation, addParticipants, currentParticipantIds)

    currentParticipantIds = currentParticipantIds.concat(addedIds)

    const removeResult = await this.removeParticipants(conversation, removeParticipants, currentParticipantIds)

    if (!removeResult.isEmptyAndDeleted && removeResult.removedIds?.length) {
      currentParticipantIds = currentParticipantIds.filter(
        (currentPId) =>
          !removeResult.removedIds.find((removedId) => this.helpers.isEqualsNativeIds(removedId, currentPId))
      )
    }

    return { addedIds, ...removeResult, currentIds: currentParticipantIds }
  }

  async addParticipants(conversation, participantIds, currentParticipantIds) {
    if (!currentParticipantIds) {
      currentParticipantIds = await this.findConversationParticipants(conversation._id)
    }

    participantIds = participantIds.filter(
      (pId) => !currentParticipantIds.find((currentPId) => this.helpers.isEqualsNativeIds(currentPId, pId))
    )

    const participantsCount = participantIds.length + currentParticipantIds.length

    if (participantsCount > this.CONVERSATION_MAX_PARTICIPANTS) {
      throw new Error(ERROR_STATUES.PARTICIPANTS_LIMIT.message, {
        cause: ERROR_STATUES.PARTICIPANTS_LIMIT,
      })
    }

    if (participantIds.length) {
      const createParticipantsParams = participantIds.map((participantId) => ({
        conversation_id: conversation._id,
        user_id: participantId,
        organization_id: conversation.organization_id,
      }))

      await this.conversationParticipantRepo.createMany(createParticipantsParams)
    }

    if (conversation.type === "c") {
      await this.conversationRepo.updateSubscribersCount(conversation._id, participantsCount)
      conversation.set("subscribers_count", participantsCount)
    }

    return participantIds
  }

  async removeParticipants(conversation, participantIds, currentParticipantIds) {
    const result = { removedIds: null, newOwnerId: null, isEmptyAndDeleted: false }

    if (!currentParticipantIds) {
      currentParticipantIds = await this.findConversationParticipants(conversation._id)
    }

    participantIds = participantIds.filter((pId) =>
      currentParticipantIds.find((currentPId) => this.helpers.isEqualsNativeIds(currentPId, pId))
    )
    await this.conversationParticipantRepo.removeParticipants(conversation._id, participantIds)
    result.removedIds = participantIds
    currentParticipantIds = currentParticipantIds.filter(
      (currentPId) => !participantIds.find((removedId) => this.helpers.isEqualsNativeIds(removedId, currentPId))
    )

    const isConversationHasParticipants = await this.conversationParticipantRepo.isConversationHasParticipants(
      conversation._id
    )

    if (!isConversationHasParticipants) {
      await this.conversationRepo.deleteById(conversation._id)
      result.isEmptyAndDeleted = true
      return result
    }

    const isOwnerInRemove = participantIds.find((pId) => this.helpers.isEqualsNativeIds(pId, conversation.owner_id))
    if (isOwnerInRemove && conversation.type !== "u") {
      const newOwnerId = currentParticipantIds.at(0)
      await this.conversationRepo.updateOwner(conversation._id, newOwnerId)
      result.newOwnerId = newOwnerId
    }

    if (conversation.type === "c") {
      await this.conversationRepo.updateSubscribersCount(conversation._id, currentParticipantIds.length)
      conversation.set("subscribers_count", currentParticipantIds.length)
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
