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

let samaClientA_Device1 = void 0
let samaClientB_Device1 = void 0
let samaClientB_Device2 = void 0

let userAToken = void 0
let userBToken = void 0

let nodeA = void 0
let nodeB = void 0

describe("Cross-node behavior", () => {
  before(async () => {
    console.log("[Before][cross-node-multi-devices]")

    configNodeA.organization_id = dummyDataTestConfig.organizationId
    configNodeB.organization_id = dummyDataTestConfig.organizationId

    samaClientA_Device1 = new SAMAClient(configNodeA)
    samaClientA_Device1.deviceId = v4()
    samaClientB_Device1 = new SAMAClient(configNodeB)
    samaClientB_Device1.deviceId = v4()
    samaClientB_Device2 = new SAMAClient(configNodeB)
    samaClientB_Device2.deviceId = v4()

    nodeA = await startOrAccessNodeA()
    nodeB = await startOrAccessNodeB()

    await setTimeoutPromise(500)
  })

  describe("Node-A(userA_Device1) - Node-B(userB_Device1,userB_Device2)", () => {
    describe("Connect", () => {
      it("connect userA_Device1", async () => {
        await samaClientA_Device1.connect()
        const { token } = await samaClientA_Device1.socketLogin({
          user: { login: dummyDataTestConfig.users.userA.login, password: userPassword },
        })
        userAToken = token
      })

      it("subscribe userB last activity", async () => {
        const activity = await samaClientA_Device1.subscribeToUserActivity(dummyDataTestConfig.users.userB.nativeId)
        assert.ok(activity[dummyDataTestConfig.users.userB.nativeId] > 0)
      })

      it("connect userB_Device1 and check last activity", (done) => {
        samaClientB_Device1
          .connect()
          .then(() =>
            samaClientB_Device1.socketLogin({
              user: { login: dummyDataTestConfig.users.userB.login, password: userPassword },
            })
          )
          .then(({ token }) => (userBToken = token))

        samaClientA_Device1.onUserActivityListener = (activity) => {
          assert.equal(activity[dummyDataTestConfig.users.userB.nativeId], 0)
          done()
        }
      })

      it("connect userB_Device2 and check last activity", (done) => {
        samaClientB_Device2
          .connect()
          .then(() => samaClientB_Device2.socketLogin({ user: { login: dummyDataTestConfig.users.userB.login, password: userPassword } }))
        samaClientA_Device1.onUserActivityListener = (activity) => {
          assert.equal(activity[dummyDataTestConfig.users.userB.nativeId], 0)
          done()
        }
      })

      it("subscribe userA last activity", async () => {
        let activity = await samaClientB_Device1.subscribeToUserActivity(dummyDataTestConfig.users.userA.nativeId)
        assert.ok(activity[dummyDataTestConfig.users.userA.nativeId] === 0)

        activity = await samaClientB_Device2.subscribeToUserActivity(dummyDataTestConfig.users.userA.nativeId)
        assert.ok(activity[dummyDataTestConfig.users.userA.nativeId] === 0)
      })
    })

    describe("Base messaging", () => {
      describe("System", () => {
        describe("userA_Device1 -> userB_Device1,userB_Device2", async () => {
          it("event", async () => {
            const mId = v4()
            samaClientA_Device1.messageSystem({ mid: mId, uids: [dummyDataTestConfig.users.userB.nativeId], x: { one: "1" } })

            const uA_D1_promise = new Promise((resolve, reject) => {
              samaClientB_Device1.onSystemMessageEvent = (message) => {
                assert.equal(message._id, mId)
                assert.equal(message.from, dummyDataTestConfig.users.userA.nativeId)

                resolve()
              }
            })

            const uA_D2_promise = new Promise((resolve, reject) => {
              samaClientB_Device2.onSystemMessageEvent = (message) => {
                assert.equal(message._id, mId)
                assert.equal(message.from, dummyDataTestConfig.users.userA.nativeId)

                resolve()
              }
            })

            await Promise.all([uA_D1_promise, uA_D2_promise])
          })
        })

        describe("userB_Device1 sender", () => {
          it("event to userA_Device1", (done) => {
            const mId = v4()
            samaClientB_Device1.messageSystem({ mid: mId, uids: [dummyDataTestConfig.users.userA.nativeId], x: { two: "2" } })

            samaClientA_Device1.onSystemMessageEvent = (message) => {
              assert.equal(message._id, mId)
              assert.equal(message.from, dummyDataTestConfig.users.userB.nativeId)

              done()
            }
          })

          it("event to userA_Device1,userB_Device2", async () => {
            const mId = v4()
            samaClientB_Device1.messageSystem({
              mid: mId,
              uids: [dummyDataTestConfig.users.userA.nativeId, dummyDataTestConfig.users.userB.nativeId],
              x: { two: "22" },
            })

            const uA_D1_promise = new Promise((resolve, reject) => {
              samaClientA_Device1.onSystemMessageEvent = (message) => {
                assert.equal(message._id, mId)
                assert.equal(message.from, dummyDataTestConfig.users.userB.nativeId)

                resolve()
              }
            })

            const uB_D2_promise = new Promise((resolve, reject) => {
              samaClientB_Device2.onSystemMessageEvent = (message) => {
                assert.equal(message._id, mId)
                assert.equal(message.from, dummyDataTestConfig.users.userB.nativeId)

                resolve()
              }
            })

            await Promise.all([uA_D1_promise, uB_D2_promise])
          })
        })

        describe("userB_Device2 sender", () => {
          it("event to conversation", async () => {
            const mId = v4()
            samaClientB_Device2.messageSystem({ mid: mId, cid: dummyDataTestConfig.conversations.private.nativeId, x: { four: "44" } })

            const uA_D1_promise = new Promise((resolve, reject) => {
              samaClientA_Device1.onSystemMessageEvent = (message) => {
                assert.equal(message._id, mId)
                assert.equal(message.from, dummyDataTestConfig.users.userB.nativeId)

                resolve()
              }
            })

            const uB_D1_promise = new Promise((resolve, reject) => {
              samaClientB_Device1.onSystemMessageEvent = (message) => {
                assert.equal(message._id, mId)
                assert.equal(message.from, dummyDataTestConfig.users.userB.nativeId)

                resolve()
              }
            })

            await Promise.all([uA_D1_promise, uB_D1_promise])
          })
        })
      })

      describe("Private", () => {
        describe("userA_Device1 -> userB_Device1,userB_Device2", () => {
          let messageId = void 0

          it("typing", async () => {
            samaClientA_Device1.sendTypingStatus({ cid: dummyDataTestConfig.conversations.private.nativeId, status: "start" })

            const uB_D1_promise = new Promise((resolve, reject) => {
              samaClientB_Device1.onUserTypingListener = (typing) => {
                assert.equal(typing.cid, dummyDataTestConfig.conversations.private.nativeId)
                assert.equal(typing.from, dummyDataTestConfig.users.userA.nativeId)
                resolve()
              }
            })

            const uB_D2_promise = new Promise((resolve, reject) => {
              samaClientB_Device2.onUserTypingListener = (typing) => {
                assert.equal(typing.cid, dummyDataTestConfig.conversations.private.nativeId)
                assert.equal(typing.from, dummyDataTestConfig.users.userA.nativeId)
                resolve()
              }
            })

            await Promise.all([uB_D1_promise, uB_D2_promise])
          })

          it("message", async () => {
            const mId = v4()
            const body = `Cluster Test Hello m: ${mId}`
            samaClientA_Device1.messageCreate({
              cid: dummyDataTestConfig.conversations.private.nativeId,
              body: body,
              mid: mId,
              x: { two: "2" },
            })

            const uB_D1_promise = new Promise((resolve, reject) => {
              samaClientB_Device1.onMessageEvent = (message) => {
                assert.equal(message.body, body)
                assert.equal(message.cid, dummyDataTestConfig.conversations.private.nativeId)
                assert.equal(message.from, dummyDataTestConfig.users.userA.nativeId)
                assert.equal(message.x["two"], "2")

                messageId = message._id

                resolve()
              }
            })

            const uB_D2_promise = new Promise((resolve, reject) => {
              samaClientB_Device2.onMessageEvent = (message) => {
                assert.equal(message.body, body)
                assert.equal(message.cid, dummyDataTestConfig.conversations.private.nativeId)
                assert.equal(message.from, dummyDataTestConfig.users.userA.nativeId)
                assert.equal(message.x["two"], "2")

                messageId = message._id

                resolve()
              }
            })

            await Promise.all([uB_D1_promise, uB_D2_promise])
          })

          it("read status", (done) => {
            samaClientB_Device2.markConversationAsRead({ cid: dummyDataTestConfig.conversations.private.nativeId, mids: [messageId] })

            samaClientA_Device1.onMessageStatusListener = (status) => {
              assert.equal(status.ids.at(0), messageId)
              assert.equal(status.cid, dummyDataTestConfig.conversations.private.nativeId)
              assert.equal(status.from, dummyDataTestConfig.users.userB.nativeId)

              done()
            }
          })
        })

        describe("userB_Device1 -> userA_Device1,userB_Device2", () => {
          let messageId = void 0

          it("typing", async () => {
            samaClientB_Device1.sendTypingStatus({ cid: dummyDataTestConfig.conversations.private.nativeId, status: "start" })

            const uA_D1_promise = new Promise((resolve, reject) => {
              samaClientA_Device1.onUserTypingListener = (typing) => {
                assert.equal(typing.cid, dummyDataTestConfig.conversations.private.nativeId)
                assert.equal(typing.from, dummyDataTestConfig.users.userB.nativeId)
                resolve()
              }
            })

            const uB_D2_promise = new Promise((resolve, reject) => {
              samaClientB_Device2.onUserTypingListener = (typing) => {
                assert.equal(typing.cid, dummyDataTestConfig.conversations.private.nativeId)
                assert.equal(typing.from, dummyDataTestConfig.users.userB.nativeId)
                resolve()
              }
            })

            await Promise.all([uA_D1_promise, uB_D2_promise])
          })

          it("message", async () => {
            const mId = v4()
            const body = `Cluster Test Hello m: ${mId}`
            samaClientB_Device1.messageCreate({
              cid: dummyDataTestConfig.conversations.private.nativeId,
              body: body,
              mid: mId,
              x: { two: "22" },
            })

            const uA_D1_promise = new Promise((resolve, reject) => {
              samaClientA_Device1.onMessageEvent = (message) => {
                assert.equal(message.body, body)
                assert.equal(message.cid, dummyDataTestConfig.conversations.private.nativeId)
                assert.equal(message.from, dummyDataTestConfig.users.userB.nativeId)
                assert.equal(message.x["two"], "22")

                messageId = message._id

                resolve()
              }
            })

            const uB_D2_promise = new Promise((resolve, reject) => {
              samaClientB_Device2.onMessageEvent = (message) => {
                assert.equal(message.body, body)
                assert.equal(message.cid, dummyDataTestConfig.conversations.private.nativeId)
                assert.equal(message.from, dummyDataTestConfig.users.userB.nativeId)
                assert.equal(message.x["two"], "22")

                messageId = message._id

                resolve()
              }
            })

            await Promise.all([uA_D1_promise, uB_D2_promise])
          })

          it("read status", async () => {
            samaClientA_Device1.markConversationAsRead({ cid: dummyDataTestConfig.conversations.private.nativeId, mids: [messageId] })

            const uB_D1_promise = new Promise((resolve, reject) => {
              samaClientB_Device1.onMessageStatusListener = (status) => {
                assert.equal(status.ids.at(0), messageId)
                assert.equal(status.cid, dummyDataTestConfig.conversations.private.nativeId)
                assert.equal(status.from, dummyDataTestConfig.users.userA.nativeId)

                resolve()
              }
            })

            const uB_D2_promise = new Promise((resolve, reject) => {
              samaClientB_Device2.onMessageStatusListener = (status) => {
                assert.equal(status.ids.at(0), messageId)
                assert.equal(status.cid, dummyDataTestConfig.conversations.private.nativeId)
                assert.equal(status.from, dummyDataTestConfig.users.userA.nativeId)

                resolve()
              }
            })

            await Promise.all([uB_D1_promise, uB_D2_promise])
          })
        })
      })

      describe("Group", () => {
        describe("userA_Device1 -> userB_Device1,userB_Device2", () => {
          let messageId = void 0

          it("typing", async () => {
            samaClientA_Device1.sendTypingStatus({ cid: dummyDataTestConfig.conversations.group.nativeId, status: "start" })

            const uB_D1_promise = new Promise((resolve, reject) => {
              samaClientB_Device1.onUserTypingListener = (typing) => {
                assert.equal(typing.cid, dummyDataTestConfig.conversations.group.nativeId)
                assert.equal(typing.from, dummyDataTestConfig.users.userA.nativeId)
                resolve()
              }
            })

            const uB_D2_promise = new Promise((resolve, reject) => {
              samaClientB_Device2.onUserTypingListener = (typing) => {
                assert.equal(typing.cid, dummyDataTestConfig.conversations.group.nativeId)
                assert.equal(typing.from, dummyDataTestConfig.users.userA.nativeId)
                resolve()
              }
            })

            await Promise.all([uB_D1_promise, uB_D2_promise])
          })

          it("message", async () => {
            const mId = v4()
            const body = `Cluster Test Hello m: ${mId}`
            samaClientA_Device1.messageCreate({
              cid: dummyDataTestConfig.conversations.group.nativeId,
              body: body,
              mid: mId,
              x: { two: "2" },
            })

            const uB_D1_promise = new Promise((resolve, reject) => {
              samaClientB_Device1.onMessageEvent = (message) => {
                assert.equal(message.body, body)
                assert.equal(message.cid, dummyDataTestConfig.conversations.group.nativeId)
                assert.equal(message.from, dummyDataTestConfig.users.userA.nativeId)
                assert.equal(message.x["two"], "2")

                messageId = message._id

                resolve()
              }
            })

            const uB_D2_promise = new Promise((resolve, reject) => {
              samaClientB_Device2.onMessageEvent = (message) => {
                assert.equal(message.body, body)
                assert.equal(message.cid, dummyDataTestConfig.conversations.group.nativeId)
                assert.equal(message.from, dummyDataTestConfig.users.userA.nativeId)
                assert.equal(message.x["two"], "2")

                messageId = message._id

                resolve()
              }
            })

            await Promise.all([uB_D1_promise, uB_D2_promise])
          })

          it("read status", (done) => {
            samaClientB_Device2.markConversationAsRead({ cid: dummyDataTestConfig.conversations.group.nativeId, mids: [messageId] })

            samaClientA_Device1.onMessageStatusListener = (status) => {
              assert.equal(status.ids.at(0), messageId)
              assert.equal(status.cid, dummyDataTestConfig.conversations.group.nativeId)
              assert.equal(status.from, dummyDataTestConfig.users.userB.nativeId)

              done()
            }
          })
        })

        describe("userB_Device1 -> userA_Device1,userB_Device2", () => {
          let messageId = void 0

          it("typing", async () => {
            samaClientB_Device1.sendTypingStatus({ cid: dummyDataTestConfig.conversations.group.nativeId, status: "start" })

            const uA_D1_promise = new Promise((resolve, reject) => {
              samaClientA_Device1.onUserTypingListener = (typing) => {
                assert.equal(typing.cid, dummyDataTestConfig.conversations.group.nativeId)
                assert.equal(typing.from, dummyDataTestConfig.users.userB.nativeId)
                resolve()
              }
            })

            const uB_D2_promise = new Promise((resolve, reject) => {
              samaClientB_Device2.onUserTypingListener = (typing) => {
                assert.equal(typing.cid, dummyDataTestConfig.conversations.group.nativeId)
                assert.equal(typing.from, dummyDataTestConfig.users.userB.nativeId)
                resolve()
              }
            })

            await Promise.all([uA_D1_promise, uB_D2_promise])
          })

          it("message", async () => {
            const mId = v4()
            const body = `Cluster Test Hello m: ${mId}`
            samaClientB_Device1.messageCreate({
              cid: dummyDataTestConfig.conversations.group.nativeId,
              body: body,
              mid: mId,
              x: { two: "22" },
            })

            const uA_D1_promise = new Promise((resolve, reject) => {
              samaClientA_Device1.onMessageEvent = (message) => {
                assert.equal(message.body, body)
                assert.equal(message.cid, dummyDataTestConfig.conversations.group.nativeId)
                assert.equal(message.from, dummyDataTestConfig.users.userB.nativeId)
                assert.equal(message.x["two"], "22")

                messageId = message._id

                resolve()
              }
            })

            const uB_D2_promise = new Promise((resolve, reject) => {
              samaClientB_Device2.onMessageEvent = (message) => {
                assert.equal(message.body, body)
                assert.equal(message.cid, dummyDataTestConfig.conversations.group.nativeId)
                assert.equal(message.from, dummyDataTestConfig.users.userB.nativeId)
                assert.equal(message.x["two"], "22")

                messageId = message._id

                resolve()
              }
            })

            await Promise.all([uA_D1_promise, uB_D2_promise])
          })

          it("read status", async () => {
            samaClientA_Device1.markConversationAsRead({ cid: dummyDataTestConfig.conversations.group.nativeId, mids: [messageId] })

            const uB_D1_promise = new Promise((resolve, reject) => {
              samaClientB_Device1.onMessageStatusListener = (status) => {
                assert.equal(status.ids.at(0), messageId)
                assert.equal(status.cid, dummyDataTestConfig.conversations.group.nativeId)
                assert.equal(status.from, dummyDataTestConfig.users.userA.nativeId)

                resolve()
              }
            })

            const uB_D2_promise = new Promise((resolve, reject) => {
              samaClientB_Device2.onMessageStatusListener = (status) => {
                assert.equal(status.ids.at(0), messageId)
                assert.equal(status.cid, dummyDataTestConfig.conversations.group.nativeId)
                assert.equal(status.from, dummyDataTestConfig.users.userA.nativeId)

                resolve()
              }
            })

            await Promise.all([uB_D1_promise, uB_D2_promise])
          })
        })
      })
    })

    describe("Activity on disconnect", () => {
      it("userB_Device1 logout (not last activity)", async () => {
        samaClientB_Device1.disconnect()

        const promise = new Promise((resolve, reject) => {
          setTimeout(() => resolve(), 500)

          samaClientA_Device1.onUserActivityListener = (activity) => {
            if (activity[dummyDataTestConfig.users.userB.nativeId] > 0) {
              reject(new Error("Should not be called"))
            }
          }
        })

        await promise
      })

      it("userB_Device1 logout (last activity)", (done) => {
        samaClientB_Device2.disconnect()

        samaClientA_Device1.onUserActivityListener = (activity) => {
          assert.ok(activity[dummyDataTestConfig.users.userB.nativeId] > 0)
          done()
        }
      })

      it("disconnect A", async () => {
        samaClientA_Device1.disconnect()
        await setTimeoutPromise(200)
      })
    })
  })

  describe("Node-A (userA_Device1, userB_Device2) - Node-B (userB_Device1)", () => {
    describe("Connect", () => {
      it("connect userA_Device1", async () => {
        await samaClientA_Device1.connect()
        const { token } = await samaClientA_Device1.socketLogin({
          user: { login: dummyDataTestConfig.users.userA.login, password: userPassword },
        })
        userAToken = token
      })

      it("subscribe user B last activity", async () => {
        const activity = await samaClientA_Device1.subscribeToUserActivity(dummyDataTestConfig.users.userB.nativeId)
        assert.ok(activity[dummyDataTestConfig.users.userB.nativeId] > 0)
      })

      it("connect userB_Device1 and check last activity", (done) => {
        samaClientB_Device1
          .connect()
          .then(() =>
            samaClientB_Device1.socketLogin({
              user: { login: dummyDataTestConfig.users.userB.login, password: userPassword },
            })
          )
          .then(({ token }) => (userBToken = token))

        samaClientA_Device1.onUserActivityListener = (activity) => {
          assert.equal(activity[dummyDataTestConfig.users.userB.nativeId], 0)
          done()
        }
      })

      it("connect userB_Device2 and check last activity", (done) => {
        samaClientB_Device2
          .connect(NODE_1_WS_ENDPOINT, NODE_1_HTTP_ENDPOINT)
          .then(() => samaClientB_Device2.socketLogin({ user: { login: dummyDataTestConfig.users.userB.login, password: userPassword } }))
        samaClientA_Device1.onUserActivityListener = (activity) => {
          assert.equal(activity[dummyDataTestConfig.users.userB.nativeId], 0)
          done()
        }
      })

      it("subscribe user A last activity", async () => {
        let activity = await samaClientB_Device1.subscribeToUserActivity(dummyDataTestConfig.users.userA.nativeId)
        assert.ok(activity[dummyDataTestConfig.users.userA.nativeId] === 0)

        activity = await samaClientB_Device2.subscribeToUserActivity(dummyDataTestConfig.users.userA.nativeId)
        assert.ok(activity[dummyDataTestConfig.users.userA.nativeId] === 0)
      })
    })

    describe("Base messaging", () => {
      describe("System", () => {
        describe("userA_Device1 -> userB_Device1,userB_Device2", async () => {
          it("event", async () => {
            const mId = v4()
            samaClientA_Device1.messageSystem({ mid: mId, uids: [dummyDataTestConfig.users.userB.nativeId], x: { one: "1" } })

            const uA_D1_promise = new Promise((resolve, reject) => {
              samaClientB_Device1.onSystemMessageEvent = (message) => {
                assert.equal(message._id, mId)
                assert.equal(message.from, dummyDataTestConfig.users.userA.nativeId)

                resolve()
              }
            })

            const uA_D2_promise = new Promise((resolve, reject) => {
              samaClientB_Device2.onSystemMessageEvent = (message) => {
                assert.equal(message._id, mId)
                assert.equal(message.from, dummyDataTestConfig.users.userA.nativeId)

                resolve()
              }
            })

            await Promise.all([uA_D1_promise, uA_D2_promise])
          })
        })

        describe("userB_Device1 sender", () => {
          it("event to userA_Device1", (done) => {
            const mId = v4()
            samaClientB_Device1.messageSystem({ mid: mId, uids: [dummyDataTestConfig.users.userA.nativeId], x: { two: "2" } })

            samaClientA_Device1.onSystemMessageEvent = (message) => {
              assert.equal(message._id, mId)
              assert.equal(message.from, dummyDataTestConfig.users.userB.nativeId)

              done()
            }
          })

          it("event to userA_Device1,userB_Device2", async () => {
            const mId = v4()
            samaClientB_Device1.messageSystem({
              mid: mId,
              uids: [dummyDataTestConfig.users.userA.nativeId, dummyDataTestConfig.users.userB.nativeId],
              x: { two: "22" },
            })

            const uA_D1_promise = new Promise((resolve, reject) => {
              samaClientA_Device1.onSystemMessageEvent = (message) => {
                assert.equal(message._id, mId)
                assert.equal(message.from, dummyDataTestConfig.users.userB.nativeId)

                resolve()
              }
            })

            const uB_D2_promise = new Promise((resolve, reject) => {
              samaClientB_Device2.onSystemMessageEvent = (message) => {
                assert.equal(message._id, mId)
                assert.equal(message.from, dummyDataTestConfig.users.userB.nativeId)

                resolve()
              }
            })

            await Promise.all([uA_D1_promise, uB_D2_promise])
          })
        })

        describe("userB_Device2 sender", () => {
          it("event to conversation", async () => {
            const mId = v4()
            samaClientB_Device2.messageSystem({ mid: mId, cid: dummyDataTestConfig.conversations.private.nativeId, x: { four: "44" } })

            const uA_D1_promise = new Promise((resolve, reject) => {
              samaClientA_Device1.onSystemMessageEvent = (message) => {
                assert.equal(message._id, mId)
                assert.equal(message.from, dummyDataTestConfig.users.userB.nativeId)

                resolve()
              }
            })

            const uB_D1_promise = new Promise((resolve, reject) => {
              samaClientB_Device1.onSystemMessageEvent = (message) => {
                assert.equal(message._id, mId)
                assert.equal(message.from, dummyDataTestConfig.users.userB.nativeId)

                resolve()
              }
            })

            await Promise.all([uA_D1_promise, uB_D1_promise])
          })
        })
      })

      describe("Private", () => {
        describe("userA_Device1 -> userB_Device1,userB_Device2", () => {
          let messageId = void 0

          it("typing", async () => {
            samaClientA_Device1.sendTypingStatus({ cid: dummyDataTestConfig.conversations.private.nativeId, status: "start" })

            const uB_D1_promise = new Promise((resolve, reject) => {
              samaClientB_Device1.onUserTypingListener = (typing) => {
                assert.equal(typing.cid, dummyDataTestConfig.conversations.private.nativeId)
                assert.equal(typing.from, dummyDataTestConfig.users.userA.nativeId)
                resolve()
              }
            })

            const uB_D2_promise = new Promise((resolve, reject) => {
              samaClientB_Device2.onUserTypingListener = (typing) => {
                assert.equal(typing.cid, dummyDataTestConfig.conversations.private.nativeId)
                assert.equal(typing.from, dummyDataTestConfig.users.userA.nativeId)
                resolve()
              }
            })

            await Promise.all([uB_D1_promise, uB_D2_promise])
          })

          it("message", async () => {
            const mId = v4()
            const body = `Cluster Test Hello m: ${mId}`
            samaClientA_Device1.messageCreate({
              cid: dummyDataTestConfig.conversations.private.nativeId,
              body: body,
              mid: mId,
              x: { two: "2" },
            })

            const uB_D1_promise = new Promise((resolve, reject) => {
              samaClientB_Device1.onMessageEvent = (message) => {
                assert.equal(message.body, body)
                assert.equal(message.cid, dummyDataTestConfig.conversations.private.nativeId)
                assert.equal(message.from, dummyDataTestConfig.users.userA.nativeId)
                assert.equal(message.x["two"], "2")

                messageId = message._id

                resolve()
              }
            })

            const uB_D2_promise = new Promise((resolve, reject) => {
              samaClientB_Device2.onMessageEvent = (message) => {
                assert.equal(message.body, body)
                assert.equal(message.cid, dummyDataTestConfig.conversations.private.nativeId)
                assert.equal(message.from, dummyDataTestConfig.users.userA.nativeId)
                assert.equal(message.x["two"], "2")

                messageId = message._id

                resolve()
              }
            })

            await Promise.all([uB_D1_promise, uB_D2_promise])
          })

          it("read status", (done) => {
            samaClientB_Device2.markConversationAsRead({ cid: dummyDataTestConfig.conversations.private.nativeId, mids: [messageId] })

            samaClientA_Device1.onMessageStatusListener = (status) => {
              assert.equal(status.ids.at(0), messageId)
              assert.equal(status.cid, dummyDataTestConfig.conversations.private.nativeId)
              assert.equal(status.from, dummyDataTestConfig.users.userB.nativeId)

              done()
            }
          })
        })

        describe("userB_Device1 -> userA_Device1,userB_Device2", () => {
          let messageId = void 0

          it("typing", async () => {
            samaClientB_Device1.sendTypingStatus({ cid: dummyDataTestConfig.conversations.private.nativeId, status: "start" })

            const uA_D1_promise = new Promise((resolve, reject) => {
              samaClientA_Device1.onUserTypingListener = (typing) => {
                assert.equal(typing.cid, dummyDataTestConfig.conversations.private.nativeId)
                assert.equal(typing.from, dummyDataTestConfig.users.userB.nativeId)
                resolve()
              }
            })

            const uB_D2_promise = new Promise((resolve, reject) => {
              samaClientB_Device2.onUserTypingListener = (typing) => {
                assert.equal(typing.cid, dummyDataTestConfig.conversations.private.nativeId)
                assert.equal(typing.from, dummyDataTestConfig.users.userB.nativeId)
                resolve()
              }
            })

            await Promise.all([uA_D1_promise, uB_D2_promise])
          })

          it("message", async () => {
            const mId = v4()
            const body = `Cluster Test Hello m: ${mId}`
            samaClientB_Device1.messageCreate({
              cid: dummyDataTestConfig.conversations.private.nativeId,
              body: body,
              mid: mId,
              x: { two: "22" },
            })

            const uA_D1_promise = new Promise((resolve, reject) => {
              samaClientA_Device1.onMessageEvent = (message) => {
                assert.equal(message.body, body)
                assert.equal(message.cid, dummyDataTestConfig.conversations.private.nativeId)
                assert.equal(message.from, dummyDataTestConfig.users.userB.nativeId)
                assert.equal(message.x["two"], "22")

                messageId = message._id

                resolve()
              }
            })

            const uB_D2_promise = new Promise((resolve, reject) => {
              samaClientB_Device2.onMessageEvent = (message) => {
                assert.equal(message.body, body)
                assert.equal(message.cid, dummyDataTestConfig.conversations.private.nativeId)
                assert.equal(message.from, dummyDataTestConfig.users.userB.nativeId)
                assert.equal(message.x["two"], "22")

                messageId = message._id

                resolve()
              }
            })

            await Promise.all([uA_D1_promise, uB_D2_promise])
          })

          it("read status", async () => {
            samaClientA_Device1.markConversationAsRead({ cid: dummyDataTestConfig.conversations.private.nativeId, mids: [messageId] })

            const uB_D1_promise = new Promise((resolve, reject) => {
              samaClientB_Device1.onMessageStatusListener = (status) => {
                assert.equal(status.ids.at(0), messageId)
                assert.equal(status.cid, dummyDataTestConfig.conversations.private.nativeId)
                assert.equal(status.from, dummyDataTestConfig.users.userA.nativeId)

                resolve()
              }
            })

            const uB_D2_promise = new Promise((resolve, reject) => {
              samaClientB_Device2.onMessageStatusListener = (status) => {
                assert.equal(status.ids.at(0), messageId)
                assert.equal(status.cid, dummyDataTestConfig.conversations.private.nativeId)
                assert.equal(status.from, dummyDataTestConfig.users.userA.nativeId)

                resolve()
              }
            })

            await Promise.all([uB_D1_promise, uB_D2_promise])
          })
        })
      })

      describe("Group", () => {
        describe("userA_Device1 -> userB_Device1,userB_Device2", () => {
          let messageId = void 0

          it("typing", async () => {
            samaClientA_Device1.sendTypingStatus({ cid: dummyDataTestConfig.conversations.group.nativeId, status: "start" })

            const uB_D1_promise = new Promise((resolve, reject) => {
              samaClientB_Device1.onUserTypingListener = (typing) => {
                assert.equal(typing.cid, dummyDataTestConfig.conversations.group.nativeId)
                assert.equal(typing.from, dummyDataTestConfig.users.userA.nativeId)
                resolve()
              }
            })

            const uB_D2_promise = new Promise((resolve, reject) => {
              samaClientB_Device2.onUserTypingListener = (typing) => {
                assert.equal(typing.cid, dummyDataTestConfig.conversations.group.nativeId)
                assert.equal(typing.from, dummyDataTestConfig.users.userA.nativeId)
                resolve()
              }
            })

            await Promise.all([uB_D1_promise, uB_D2_promise])
          })

          it("message", async () => {
            const mId = v4()
            const body = `Cluster Test Hello m: ${mId}`
            samaClientA_Device1.messageCreate({
              cid: dummyDataTestConfig.conversations.group.nativeId,
              body: body,
              mid: mId,
              x: { two: "2" },
            })

            const uB_D1_promise = new Promise((resolve, reject) => {
              samaClientB_Device1.onMessageEvent = (message) => {
                assert.equal(message.body, body)
                assert.equal(message.cid, dummyDataTestConfig.conversations.group.nativeId)
                assert.equal(message.from, dummyDataTestConfig.users.userA.nativeId)
                assert.equal(message.x["two"], "2")

                messageId = message._id

                resolve()
              }
            })

            const uB_D2_promise = new Promise((resolve, reject) => {
              samaClientB_Device2.onMessageEvent = (message) => {
                assert.equal(message.body, body)
                assert.equal(message.cid, dummyDataTestConfig.conversations.group.nativeId)
                assert.equal(message.from, dummyDataTestConfig.users.userA.nativeId)
                assert.equal(message.x["two"], "2")

                messageId = message._id

                resolve()
              }
            })

            await Promise.all([uB_D1_promise, uB_D2_promise])
          })

          it("read status", (done) => {
            samaClientB_Device2.markConversationAsRead({ cid: dummyDataTestConfig.conversations.group.nativeId, mids: [messageId] })

            samaClientA_Device1.onMessageStatusListener = (status) => {
              assert.equal(status.ids.at(0), messageId)
              assert.equal(status.cid, dummyDataTestConfig.conversations.group.nativeId)
              assert.equal(status.from, dummyDataTestConfig.users.userB.nativeId)

              done()
            }
          })
        })

        describe("userB_Device1 -> userA_Device1,userB_Device2", () => {
          let messageId = void 0

          it("typing", async () => {
            samaClientB_Device1.sendTypingStatus({ cid: dummyDataTestConfig.conversations.group.nativeId, status: "start" })

            const uA_D1_promise = new Promise((resolve, reject) => {
              samaClientA_Device1.onUserTypingListener = (typing) => {
                assert.equal(typing.cid, dummyDataTestConfig.conversations.group.nativeId)
                assert.equal(typing.from, dummyDataTestConfig.users.userB.nativeId)
                resolve()
              }
            })

            const uB_D2_promise = new Promise((resolve, reject) => {
              samaClientB_Device2.onUserTypingListener = (typing) => {
                assert.equal(typing.cid, dummyDataTestConfig.conversations.group.nativeId)
                assert.equal(typing.from, dummyDataTestConfig.users.userB.nativeId)
                resolve()
              }
            })

            await Promise.all([uA_D1_promise, uB_D2_promise])
          })

          it("message", async () => {
            const mId = v4()
            const body = `Cluster Test Hello m: ${mId}`
            samaClientB_Device1.messageCreate({
              cid: dummyDataTestConfig.conversations.group.nativeId,
              body: body,
              mid: mId,
              x: { two: "22" },
            })

            const uA_D1_promise = new Promise((resolve, reject) => {
              samaClientA_Device1.onMessageEvent = (message) => {
                assert.equal(message.body, body)
                assert.equal(message.cid, dummyDataTestConfig.conversations.group.nativeId)
                assert.equal(message.from, dummyDataTestConfig.users.userB.nativeId)
                assert.equal(message.x["two"], "22")

                messageId = message._id

                resolve()
              }
            })

            const uB_D2_promise = new Promise((resolve, reject) => {
              samaClientB_Device2.onMessageEvent = (message) => {
                assert.equal(message.body, body)
                assert.equal(message.cid, dummyDataTestConfig.conversations.group.nativeId)
                assert.equal(message.from, dummyDataTestConfig.users.userB.nativeId)
                assert.equal(message.x["two"], "22")

                messageId = message._id

                resolve()
              }
            })

            await Promise.all([uA_D1_promise, uB_D2_promise])
          })

          it("read status", async () => {
            samaClientA_Device1.markConversationAsRead({ cid: dummyDataTestConfig.conversations.group.nativeId, mids: [messageId] })

            const uB_D1_promise = new Promise((resolve, reject) => {
              samaClientB_Device1.onMessageStatusListener = (status) => {
                assert.equal(status.ids.at(0), messageId)
                assert.equal(status.cid, dummyDataTestConfig.conversations.group.nativeId)
                assert.equal(status.from, dummyDataTestConfig.users.userA.nativeId)

                resolve()
              }
            })

            const uB_D2_promise = new Promise((resolve, reject) => {
              samaClientB_Device2.onMessageStatusListener = (status) => {
                assert.equal(status.ids.at(0), messageId)
                assert.equal(status.cid, dummyDataTestConfig.conversations.group.nativeId)
                assert.equal(status.from, dummyDataTestConfig.users.userA.nativeId)

                resolve()
              }
            })

            await Promise.all([uB_D1_promise, uB_D2_promise])
          })
        })
      })
    })

    describe("Activity on disconnect", () => {
      it("userB_Device1 logout (not last activity)", async () => {
        samaClientB_Device1.disconnect()

        const promise = new Promise((resolve, reject) => {
          setTimeout(() => resolve(), 500)

          samaClientA_Device1.onUserActivityListener = (activity) => {
            if (activity[dummyDataTestConfig.users.userB.nativeId] > 0) {
              reject(new Error("Should not be called"))
            }
          }
        })

        await promise
      })

      it("userB_Device1 logout (last activity)", (done) => {
        samaClientB_Device2.disconnect()

        samaClientA_Device1.onUserActivityListener = (activity) => {
          assert.ok(activity[dummyDataTestConfig.users.userB.nativeId] > 0)
          done()
        }
      })

      it("disconnect userA", async () => {
        samaClientA_Device1.disconnect()
        await setTimeoutPromise(200)
      })
    })
  })
})
