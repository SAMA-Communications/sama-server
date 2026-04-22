import assert from "node:assert"
import { setTimeout as setTimeoutPromise } from "node:timers/promises"

import { v4 } from "uuid"

import {
  initSdkWithUser,
  createGroupConversation,
  createPrivateConversation,
} from "./utils.js"

const orgId = process.env.TEST_CLIENT_ORG_ID
const wsEndpoint = process.env.TEST_CLIENT_WS_ENDPOINT
const httpEndpoint = process.env.TEST_CLIENT_HTTP_ENDPOINT

const clientsCount = +process.env.TEST_CLIENTS_COUNT || 10
const clientSdkDeviceIds = new Array(clientsCount).fill(0).map((_, i) => `dv-${i + 1}`)

const clientIdUserPairs = new Map()
const userSdkPairs = new Map()

let groupConv = void 0
const privateConversationsByPair = new Map()

const getPairKey = (userAId, userBId) => [userAId, userBId].sort().join(":")

const sendGroupMessageWithMarkAble = async (senderSdk, convId) => {
  const mId = v4()
  const mBody = `TestM-${mId}-original`
  const mBodyResponse = `${mBody}-Response`

  const responseMessagesUserIds = new Set()

  const waitPromise = new Promise((resolve, reject) => {
    senderSdk.onMessageEvent = (message) => {
      if ((message.cid === convId) && (message.body === mBodyResponse)) {
        responseMessagesUserIds.add(message.from)
      }

      if (responseMessagesUserIds.size === (clientsCount - 1)) {
        senderSdk.onMessageEvent = void 0
        resolve()
      }
    }
  })

  const recipientsSdks = Array.from(userSdkPairs.values()).filter(sdk => sdk !== senderSdk)

  for (const sdk of recipientsSdks) {
    sdk.onMessageEvent = (message) => {
      if ((message.cid === convId) && (message.body === mBody)) {
        sdk.messageCreate({
          cid: convId,
          body: mBodyResponse,
          mid: v4(),
        })
      }
    }
  }

  await senderSdk.messageCreate({
    cid: convId,
    body: mBody,
    mid: mId,
  })

  await waitPromise
}

const sendPrivateMessagesWithMarkAble = async (senderSdk, senderUser) => {
  const recipients = Array.from(userSdkPairs.keys()).filter(user => user !== senderUser)

  for (const recipientUser of recipients) {
    const recipientSdk = userSdkPairs.get(recipientUser)

    const pairKey = getPairKey(senderUser.native_id, recipientUser.native_id)
    const privateConversation = privateConversationsByPair.get(pairKey)

    const responseMid = v4()
    const mId = v4()
    const mBody = `TestPM-${mId}-original`
    const mBodyResponse = `${mBody}-Response`

    const waitPromise = new Promise((resolve) => {
      senderSdk.onMessageEvent = (message) => {
        if (
          (message.cid === privateConversation._id) &&
          (message.body === mBodyResponse) &&
          (message.from === recipientUser.native_id)
        ) {
          resolve()
        }
      }
    })

    recipientSdk.onMessageEvent = (message) => {
      if (
        (message.cid === privateConversation._id) &&
        (message.body === mBody) &&
        (message.from === senderUser.native_id)
      ) {
        recipientSdk.messageCreate({
          cid: privateConversation._id,
          body: mBodyResponse,
          mid: responseMid,
        })
      }
    }


    await senderSdk.messageCreate({
      cid: privateConversation._id,
      body: mBody,
      mid: mId,
    })

    await waitPromise
  }
}

const retrieveAllLastActivity = async (senderUser) => {
  const senderSdk = userSdkPairs.get(senderUser)
  const userIds = Array.from(userSdkPairs.keys()).map(user => user.native_id)

  const lastActivity = await senderSdk.getUserActivity(userIds)

  for (const [userId, seconds] of Object.entries(lastActivity)) {
    assert.ok(seconds === 0)
  }
}

describe("Multiple Clients", () => {
  describe("Init", () => {
    it("sdk array", async () => {
      for (let i = 0; i < clientsCount; ++i) {
        const deviceId = clientSdkDeviceIds.at(i)

        const { samaSdk, user } = await initSdkWithUser(
          orgId, true, `TestUser-${i}`, deviceId,
          wsEndpoint, httpEndpoint
        )

        assert.ok(samaSdk)
        assert.ok(user)

        clientIdUserPairs.set(deviceId, user)
        userSdkPairs.set(user, samaSdk)
      }
    })

    it("create group conversation", async () => {
      const users = Array.from(userSdkPairs.keys())
      const userIds = users.map(user => user.native_id)
      const ownerSdk = userSdkPairs.get(users.at(0))
      const groupConversation = await createGroupConversation(ownerSdk, userIds)

      assert.ok(groupConversation)

      groupConv = groupConversation
    })

    it("create private conversations for each pair", async () => {
      for (const user of userSdkPairs.keys()) {
        const userAId = user.native_id
        const samaSdk = userSdkPairs.get(user)
        const otherUsers = Array.from(userSdkPairs.keys()).filter(user => user.native_id !== userAId)

        for (const user of otherUsers) {
          const userBId = user.native_id
          const pairKey = getPairKey(userAId, userBId)
          const privateConversation = await createPrivateConversation(samaSdk, userAId, userBId)

          assert.ok(privateConversation)
          privateConversationsByPair.set(pairKey, privateConversation)
        }
      }
    })
  })

  describe("check last activity", () => {
    const resetSdkListeners = () => {
      for (const sdk of userSdkPairs.values()) {
        sdk.onMessageEvent = void 0
      }
    }

    beforeEach(resetSdkListeners)

    clientSdkDeviceIds.forEach((deviceId, i) => {
      it(`${deviceId} check`, async () => {
        const senderUser = clientIdUserPairs.get(deviceId)
        await retrieveAllLastActivity(senderUser)
        await setTimeoutPromise(50)
      })
    })

    afterEach(resetSdkListeners)
  })

  describe("Send messages", () => {
    const resetSdkListeners = () => {
      for (const sdk of userSdkPairs.values()) {
        sdk.onMessageEvent = void 0
      }
    }

    beforeEach(resetSdkListeners)

    clientSdkDeviceIds.forEach((deviceId, i) => {
      it(`${deviceId} sender`, async () => {
        const senderUser = clientIdUserPairs.get(deviceId)
        const senderSdk = userSdkPairs.get(senderUser)
        await sendGroupMessageWithMarkAble(senderSdk, groupConv._id)
        await setTimeoutPromise(50)
      })
    })

    afterEach(resetSdkListeners)
  })

  describe("Send private messages", () => {
    const resetSdkListeners = () => {
      for (const sdk of userSdkPairs.values()) {
        sdk.onMessageEvent = void 0
      }
    }

    beforeEach(resetSdkListeners)

    clientSdkDeviceIds.forEach((deviceId, i) => {
      it(`${deviceId} sender to private conversations`, async () => {
        const senderUser = clientIdUserPairs.get(deviceId)
        const senderSdk = userSdkPairs.get(senderUser)
        await sendPrivateMessagesWithMarkAble(senderSdk, senderUser)
        await setTimeoutPromise(50)
      })
    })

    afterEach(resetSdkListeners)
  })

  describe("check last activity", () => {
    const resetSdkListeners = () => {
      for (const sdk of userSdkPairs.values()) {
        sdk.onMessageEvent = void 0
      }
    }

    beforeEach(resetSdkListeners)

    clientSdkDeviceIds.forEach((deviceId, i) => {
      it(`${deviceId} check`, async () => {
        const senderUser = clientIdUserPairs.get(deviceId)
        await retrieveAllLastActivity(senderUser)
        await setTimeoutPromise(50)
      })
    })

    afterEach(resetSdkListeners)
  })
})