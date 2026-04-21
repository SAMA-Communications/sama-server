import assert from "node:assert"
import { setTimeout as setTimeoutPromise } from "node:timers/promises"

import { v4 } from "uuid"

import {
  initSdkWithUser,
  createGroupConversation
} from "./utils.js"

const orgId = process.env.CLIENT_TEST_ORG_ID
const wsEndpoint = process.env.CLIENT_WS_ENDPOINT
const httpEndpoint = process.env.CLIENT_HTTP_ENDPOINT

const clientsCount = 10
const clientSdkDeviceIds = new Array(clientsCount).fill(0).map((_, i) => `dv-${i}`)
const samaSdks = []
const users = []
let groupConv = void 0

const sendMessageWithMarkAble = async (samaSdk, convId) => {
  const mId = v4()
  const mBody = `TestM-${mId}-original`
  const mBodyResponse = `${mBody}-Response`

  const responseMessagesUserIds = new Set()

  const waitPromise = new Promise((resolve, reject) => {
    samaSdk.onMessageEvent = (message) => {
      if ((message.cid === convId) && (message.body === mBodyResponse)) {
        responseMessagesUserIds.add(message.from)
      }

      if (responseMessagesUserIds.size === (clientsCount - 1)) {
        samaSdk.onMessageEvent = void 0
        resolve()
      }
    }
  })

  const otherSdks = samaSdks.filter(sdk => sdk !== samaSdk)

  for (const sdk of otherSdks) {
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

  await samaSdk.messageCreate({
    cid: convId,
    body: mBody,
    mid: mId,
  })

  await waitPromise
}

describe("Multiple Clients", () => {
  describe("Init", () => {
    it("sdk array", async () => {
      for (let i = 0; i < clientsCount; ++i) {
        const { samaSdk, user } = await initSdkWithUser(
          orgId, true, `TestUser-${i}`, clientSdkDeviceIds.at(i),
          wsEndpoint, httpEndpoint
        )

        assert.ok(samaSdk)
        assert.ok(user)

        samaSdks.push(samaSdk)
        users.push(user)
      }
    })

    it("create group conversation", async () => {
      const userIds = users.map(user => user.native_id)
      const groupConversation = await createGroupConversation(samaSdks.at(0), userIds)

      assert.ok(groupConversation)

      groupConv = groupConversation
    })
  })

  describe("Send messages", () => {
    const resetSdkListeners = () => {
      for (const sdk of samaSdks) {
        sdk.onMessageEvent = void 0
      }
    }

    beforeEach(resetSdkListeners)

    clientSdkDeviceIds.forEach((deviceId, i) => {
      it(`${deviceId} sender`, async () => {
        await sendMessageWithMarkAble(samaSdks.at(i), groupConv._id)
        await setTimeoutPromise(100)
      })
    })

    afterEach(resetSdkListeners)
  })
})