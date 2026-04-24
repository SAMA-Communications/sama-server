import assert from "node:assert"
import { setTimeout as setTimeoutPromise } from "node:timers/promises"

import { v4 } from "uuid"
import { SAMAClient } from "@sama-communications/sdk"

import {
  startOrAccessNodeA,
  startOrAccessNodeB,
  NODE_1_WS_ENDPOINT,
  NODE_1_HTTP_ENDPOINT,
  NODE_2_WS_ENDPOINT,
  NODE_2_HTTP_ENDPOINT,
  dummyDataTestConfig,
  userPassword,
} from "./utils.js"

const configNodeA = {
  endpoint: {
    ws: NODE_1_WS_ENDPOINT,
    http: NODE_1_HTTP_ENDPOINT,
  },
  disableAutoReconnect: true,
}

const configNodeB = {
  endpoint: {
    ws: NODE_2_WS_ENDPOINT,
    http: NODE_2_HTTP_ENDPOINT,
  },
  disableAutoReconnect: true,
}

let samaClientA = void 0
let samaClientB = void 0

let userAToken = void 0
let userBToken = void 0

let nodeA = void 0
let nodeB = void 0

describe("Cross-node behavior", () => {
  before(async () => {
    console.log("[Before][cross-node]")

    configNodeA.organization_id = dummyDataTestConfig.organizationId
    configNodeB.organization_id = dummyDataTestConfig.organizationId

    samaClientA = new SAMAClient(configNodeA)
    samaClientA.deviceId = v4()
    samaClientB = new SAMAClient(configNodeB)
    samaClientB.deviceId = v4()

    nodeA = await startOrAccessNodeA()
    nodeB = await startOrAccessNodeB()

    await setTimeoutPromise(500)
  })

  describe("Connect", () => {
    it("connect client userA", async () => {
      await samaClientA.connect()
      const { token } = await samaClientA.socketLogin({ user: { login: dummyDataTestConfig.users.userA.login, password: userPassword } })
      userAToken = token
    })

    it("subscribe userB last activity", async () => {
      const activity = await samaClientA.subscribeToUserActivity(dummyDataTestConfig.users.userB.nativeId)
      assert.ok(activity[dummyDataTestConfig.users.userB.nativeId] > 0)
    })

    it("connect client userB and check last activity", (done) => {
      samaClientB
        .connect()
        .then(() =>
          samaClientB.socketLogin({
            user: { login: dummyDataTestConfig.users.userB.login, password: userPassword },
          })
        )
        .then(({ token }) => (userBToken = token))

      samaClientA.onUserActivityListener = (activity) => {
        assert.equal(activity[dummyDataTestConfig.users.userB.nativeId], 0)
        done()
      }
    })

    it("subscribe userA last activity", async () => {
      const activity = await samaClientB.subscribeToUserActivity(dummyDataTestConfig.users.userA.nativeId)
      assert.ok(activity[dummyDataTestConfig.users.userA.nativeId] === 0)
    })
  })

  describe("Base messaging", () => {
    describe("System", () => {
      describe("userA -> userB", () => {
        it("event", (done) => {
          const mId = v4()
          samaClientA.messageSystem({ mid: mId, uids: [dummyDataTestConfig.users.userB.nativeId], x: { one: "1" } })

          samaClientB.onSystemMessageEvent = (message) => {
            assert.equal(message._id, mId)
            assert.equal(message.from, dummyDataTestConfig.users.userA.nativeId)

            done()
          }
        })
      })

      describe("userB -> userA", () => {
        it("event", (done) => {
          const mId = v4()
          samaClientB.messageSystem({ mid: mId, uids: [dummyDataTestConfig.users.userA.nativeId], x: { two: "2" } })

          samaClientA.onSystemMessageEvent = (message) => {
            assert.equal(message._id, mId)
            assert.equal(message.from, dummyDataTestConfig.users.userB.nativeId)

            done()
          }
        })
      })
    })

    describe("Private", () => {
      describe("userA -> userB", () => {
        let messageId = void 0

        it("typing", (done) => {
          samaClientA.sendTypingStatus({ cid: dummyDataTestConfig.conversations.private.nativeId, status: "start" })

          samaClientB.onUserTypingListener = (typing) => {
            assert.equal(typing.cid, dummyDataTestConfig.conversations.private.nativeId)
            assert.equal(typing.from, dummyDataTestConfig.users.userA.nativeId)
            done()
          }
        })

        it("message", (done) => {
          const mId = v4()
          const body = `Cluster Test Hello m: ${mId}`
          samaClientA.messageCreate({ cid: dummyDataTestConfig.conversations.private.nativeId, body: body, mid: mId, x: { two: "2" } })

          samaClientB.onMessageEvent = (message) => {
            assert.equal(message.body, body)
            assert.equal(message.cid, dummyDataTestConfig.conversations.private.nativeId)
            assert.equal(message.from, dummyDataTestConfig.users.userA.nativeId)
            assert.equal(message.x["two"], "2")

            messageId = message._id

            done()
          }
        })

        it("read status", (done) => {
          samaClientB.markConversationAsRead({ cid: dummyDataTestConfig.conversations.private.nativeId, mids: [messageId] })

          samaClientA.onMessageStatusListener = (status) => {
            assert.equal(status.ids.at(0), messageId)
            assert.equal(status.cid, dummyDataTestConfig.conversations.private.nativeId)
            assert.equal(status.from, dummyDataTestConfig.users.userB.nativeId)

            done()
          }
        })
      })

      describe("userB -> userA", () => {
        let messageId = void 0

        it("typing", (done) => {
          samaClientB.sendTypingStatus({ cid: dummyDataTestConfig.conversations.private.nativeId, status: "start" })

          samaClientA.onUserTypingListener = (typing) => {
            assert.equal(typing.cid, dummyDataTestConfig.conversations.private.nativeId)
            assert.equal(typing.from, dummyDataTestConfig.users.userB.nativeId)
            done()
          }
        })

        it("message", (done) => {
          const mId = v4()
          const body = `Cluster Test Hello m: ${mId}`
          samaClientB.messageCreate({ cid: dummyDataTestConfig.conversations.private.nativeId, body: body, mid: mId, x: { two: "22" } })

          samaClientA.onMessageEvent = (message) => {
            assert.equal(message.body, body)
            assert.equal(message.cid, dummyDataTestConfig.conversations.private.nativeId)
            assert.equal(message.from, dummyDataTestConfig.users.userB.nativeId)
            assert.equal(message.x["two"], "22")

            messageId = message._id

            done()
          }
        })

        it("read status", (done) => {
          samaClientA.markConversationAsRead({ cid: dummyDataTestConfig.conversations.private.nativeId, mids: [messageId] })

          samaClientB.onMessageStatusListener = (status) => {
            assert.equal(status.ids.at(0), messageId)
            assert.equal(status.cid, dummyDataTestConfig.conversations.private.nativeId)
            assert.equal(status.from, dummyDataTestConfig.users.userA.nativeId)

            done()
          }
        })
      })
    })

    describe("Group", () => {
      describe("userA -> userB", () => {
        let messageId = void 0

        it("typing", (done) => {
          samaClientA.sendTypingStatus({ cid: dummyDataTestConfig.conversations.group.nativeId, status: "start" })

          samaClientB.onUserTypingListener = (typing) => {
            assert.equal(typing.cid, dummyDataTestConfig.conversations.group.nativeId)
            assert.equal(typing.from, dummyDataTestConfig.users.userA.nativeId)
            done()
          }
        })

        it("message", (done) => {
          const mId = v4()
          const body = `Cluster Test Hello m: ${mId}`
          samaClientA.messageCreate({ cid: dummyDataTestConfig.conversations.group.nativeId, body: body, mid: mId, x: { one: "1" } })

          samaClientB.onMessageEvent = (message) => {
            assert.equal(message.body, body)
            assert.equal(message.cid, dummyDataTestConfig.conversations.group.nativeId)
            assert.equal(message.from, dummyDataTestConfig.users.userA.nativeId)
            assert.equal(message.x["one"], "1")

            messageId = message._id

            done()
          }
        })

        it("read status", (done) => {
          samaClientB.markConversationAsRead({ cid: dummyDataTestConfig.conversations.group.nativeId, mids: [messageId] })

          samaClientA.onMessageStatusListener = (status) => {
            assert.equal(status.ids.at(0), messageId)
            assert.equal(status.cid, dummyDataTestConfig.conversations.group.nativeId)
            assert.equal(status.from, dummyDataTestConfig.users.userB.nativeId)

            done()
          }
        })
      })

      describe("userB -> userA", () => {
        let messageId = void 0

        it("typing", (done) => {
          samaClientB.sendTypingStatus({ cid: dummyDataTestConfig.conversations.group.nativeId, status: "start" })

          samaClientA.onUserTypingListener = (typing) => {
            assert.equal(typing.cid, dummyDataTestConfig.conversations.group.nativeId)
            assert.equal(typing.from, dummyDataTestConfig.users.userB.nativeId)
            done()
          }
        })

        it("message", (done) => {
          const mId = v4()
          const body = `Cluster Test Hello m: ${mId}`
          samaClientB.messageCreate({ cid: dummyDataTestConfig.conversations.group.nativeId, body: body, mid: mId, x: { one: "11" } })

          samaClientA.onMessageEvent = (message) => {
            assert.equal(message.body, body)
            assert.equal(message.cid, dummyDataTestConfig.conversations.group.nativeId)
            assert.equal(message.from, dummyDataTestConfig.users.userB.nativeId)
            assert.equal(message.x["one"], "11")

            messageId = message._id

            done()
          }
        })

        it("read status", (done) => {
          samaClientA.markConversationAsRead({ cid: dummyDataTestConfig.conversations.group.nativeId, mids: [messageId] })

          samaClientB.onMessageStatusListener = (status) => {
            assert.equal(status.ids.at(0), messageId)
            assert.equal(status.cid, dummyDataTestConfig.conversations.group.nativeId)
            assert.equal(status.from, dummyDataTestConfig.users.userA.nativeId)

            done()
          }
        })
      })
    })
  })

  describe("Activity on disconnect", () => {
    it("userA logout", (done) => {
      samaClientA.disconnect()

      samaClientB.onUserActivityListener = (activity) => {
        assert.ok(activity[dummyDataTestConfig.users.userA.nativeId] > 0)
        done()
      }
    })

    it("disconnect userB", async () => {
      samaClientB.disconnect()
      await setTimeoutPromise(200)
    })
  })
})
