import assert from "node:assert"

import ServiceLocatorContainer from "../../app/common/ServiceLocatorContainer.js"

import { generateNewOrganizationId, createUserArray, createConversation, sendLogin, mockedWS } from "../tools/utils.js"

const userRepo = ServiceLocatorContainer.use("UserRepository")
const userTokenRepo = ServiceLocatorContainer.use("UserTokenRepository")
const conversationRepo = ServiceLocatorContainer.use("ConversationRepository")
const conversationParticipantRepo = ServiceLocatorContainer.use("ConversationParticipantRepository")

let orgId = void 0
let usersIds = []
let conversationId = null
let participantsCount = 50

describe("Unit Conversation participants", async () => {
  before(async () => {
    await userRepo.deleteMany({})
    await userTokenRepo.deleteMany({})
    await conversationRepo.deleteMany({})
    await conversationParticipantRepo.deleteMany({})

    orgId = await generateNewOrganizationId()
    usersIds = await createUserArray(orgId, participantsCount)

    await sendLogin(mockedWS, orgId, "user_1")

    conversationId = await createConversation(mockedWS, void 0, void 0, "g", usersIds)
  })

  it("participants iterator", async () => {
    const batchSize = 7
    const origUserIds = usersIds.map((uId) => `${uId}`)
    const targetIterationsCount = Math.ceil(origUserIds.length / batchSize)
    const totalUserIds = []
    let iterationsCount = 0

    const conversationService = ServiceLocatorContainer.use("ConversationService")

    for await (const participantIds of conversationService.conversationParticipantIdsIterator(conversationId, [], batchSize)) {
      const isFullLength = participantIds.length === batchSize
      const isLessButNotEmpty = participantIds.length <= batchSize && participantIds.length > 0

      assert.ok(isFullLength || isLessButNotEmpty)

      const strUserIds = participantIds.map((userId) => `${userId}`)

      totalUserIds.push(...strUserIds)

      iterationsCount++
    }

    assert.equal(targetIterationsCount, iterationsCount)
    assert.equal(totalUserIds.length, origUserIds.length)

    const totalUserIdsSet = new Set(totalUserIds)
    assert.equal(totalUserIdsSet.size, totalUserIds.length)

    totalUserIds.sort()
    origUserIds.sort()

    assert.deepEqual(totalUserIds, origUserIds)
  })

  it("participants iterator with exceptIds", async () => {
    const exceptIds = [usersIds.at(4), usersIds.at(7), usersIds.at(34), usersIds.at(49), usersIds.at(21)].map((uId) => `${uId}`)
    const origUserIds = usersIds.map((uId) => `${uId}`).filter((uId) => !exceptIds.includes(uId))
    const batchSize = 10
    const targetIterationsCount = Math.ceil(origUserIds.length / batchSize)
    const totalUserIds = []
    let iterationsCount = 0

    const conversationService = ServiceLocatorContainer.use("ConversationService")

    for await (const participantIds of conversationService.conversationParticipantIdsIterator(conversationId, exceptIds, batchSize)) {
      const isFullLength = participantIds.length === batchSize
      const isLessButNotEmpty = participantIds.length <= batchSize && participantIds.length > 0

      assert.ok(isFullLength || isLessButNotEmpty)

      const strUserIds = participantIds.map((userId) => `${userId}`)

      totalUserIds.push(...strUserIds)

      iterationsCount++
    }

    assert.equal(targetIterationsCount, iterationsCount)
    assert.equal(totalUserIds.length, origUserIds.length)

    const totalUserIdsSet = new Set(totalUserIds)
    assert.equal(totalUserIdsSet.size, totalUserIds.length)

    totalUserIds.sort()
    origUserIds.sort()

    assert.deepEqual(totalUserIds, origUserIds)

    const exceptId = totalUserIds.find((uId) => exceptIds.includes(uId))
    assert.ifError(exceptId)
  })

  after(async () => {
    await userRepo.deleteMany({})
    await userTokenRepo.deleteMany({})
    await conversationRepo.deleteMany({})
    await conversationParticipantRepo.deleteMany({})

    orgId = void 0
    usersIds = []
    conversationId = null
  })
})
