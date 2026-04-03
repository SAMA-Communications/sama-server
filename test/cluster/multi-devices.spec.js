import assert from "node:assert"
import { setTimeout as setTimeoutPromise } from "node:timers/promises"

import { v4 } from "uuid"
import { SAMAClient } from "@sama-communications/sdk"

import {
  startOrAccessNodeA, startOrAccessNodeB,
  TEST_ORG_ID, TEST_U_CONV_ID, TEST_G_CONV_ID,
  NODE_1_WS_ENDPOINT, NODE_1_HTTP_ENDPOINT,
  NODE_2_WS_ENDPOINT, NODE_2_HTTP_ENDPOINT,
  userANativeId, userBNativeId
} from "./utils.js"

const configNodeA = {
  endpoint: {
    ws: NODE_1_WS_ENDPOINT,
    http: NODE_1_HTTP_ENDPOINT,
  },
  organization_id: TEST_ORG_ID,
  disableAutoReconnect: true,
}

const configNodeB = {
  endpoint: {
    ws: NODE_2_WS_ENDPOINT,
    http: NODE_2_HTTP_ENDPOINT,
  },
  organization_id: TEST_ORG_ID,
  disableAutoReconnect: true,
}

const samaClientA_Device1 = new SAMAClient(configNodeA)
samaClientA_Device1.deviceId = v4()
const samaClientB_Device1 = new SAMAClient(configNodeB)
samaClientB_Device1.deviceId = v4()
const samaClientB_Device2 = new SAMAClient(configNodeB)
samaClientB_Device2.deviceId = v4()

let userAToken = void 0
let userBToken = void 0

let nodeA = void 0
let nodeB = void 0

describe("Cross-node behavior", () => {
  before(async () => {
    console.log('[Before][cross-node-multi-devices]')
  
    nodeA = await startOrAccessNodeA()
    nodeB = await startOrAccessNodeB()

    await setTimeoutPromise(500)
  })
  
  describe("Node-A (U_A_D1) - Node-B (U_B_D1,U_B_D2)", () => {
    describe("Connect", () => {
      it("connect U_A_D1", async () => {
        await samaClientA_Device1.connect()
        const { token } = await samaClientA_Device1.socketLogin({ user: { login: 'banshiAnton1', password: '12345678' } })
        userAToken = token
      })
    
      it ("subscribe user B last activity", async () => {
        const activity = await samaClientA_Device1.subscribeToUserActivity(userBNativeId)
        assert.ok(activity[userBNativeId] > 0)
      })
    
      it("connect U_B_D1 and check last activity", (done) => {
        samaClientB_Device1
          .connect()
          .then(() => samaClientB_Device1.socketLogin({
            user: { login: 'banshiAnton2', password: '12345678' },
          })).then(({ token }) => userBToken = token)

        samaClientA_Device1.onUserActivityListener = (activity) => {
          assert.equal(activity[userBNativeId], 0)
          done()
        }
      })

      it("connect U_B_D2 and check last activity", (done) => {
        samaClientB_Device2.connect().then(() => samaClientB_Device2.socketLogin({ user: { login: 'banshiAnton2', password: '12345678' } }))
        samaClientA_Device1.onUserActivityListener = (activity) => {
          assert.equal(activity[userBNativeId], 0)
          done()
        }
      })
    
      it("subscribe user A last activity", async () => {
        let activity = await samaClientB_Device1.subscribeToUserActivity(userANativeId)
        assert.ok(activity[userANativeId] === 0)

        activity = await samaClientB_Device2.subscribeToUserActivity(userANativeId)
        assert.ok(activity[userANativeId] === 0)
      })
    })
    
    describe("Base messaging", () => {
      describe("System", () => {
        describe("U_A_D1 -> U_B_D1,U_B_D2", async () => {
          it("event", async () => {
            const mId = v4()
            samaClientA_Device1.messageSystem({ mid: mId, uids: [userBNativeId], x: { one: '1' } })

            const uA_D1_promise = new Promise((resolve, reject) => {
              samaClientB_Device1.onSystemMessageEvent = (message) => {
                assert.equal(message._id, mId)
                assert.equal(message.from, userANativeId)
        
                resolve()
              }
            })

            const uA_D2_promise = new Promise((resolve, reject) => {
              samaClientB_Device2.onSystemMessageEvent = (message) => {
                assert.equal(message._id, mId)
                assert.equal(message.from, userANativeId)
        
                resolve()
              }
            })

            await Promise.all([uA_D1_promise, uA_D2_promise])
          })
        })
    
        describe("U_B_D1 sender", () => {
          it("event to U_A_D1", (done) => {
            const mId = v4()
            samaClientB_Device1.messageSystem({ mid: mId, uids: [userANativeId], x: { two: '2' } })
      
            samaClientA_Device1.onSystemMessageEvent = (message) => {
              assert.equal(message._id, mId)
              assert.equal(message.from, userBNativeId)
      
              done()
            }
          })

          it("event to U_A_D1,U_B_D2", async () => {
            const mId = v4()
            samaClientB_Device1.messageSystem({ mid: mId, uids: [userANativeId, userBNativeId], x: { two: '22' } })
      
            const uA_D1_promise = new Promise((resolve, reject) => {
              samaClientA_Device1.onSystemMessageEvent = (message) => {
                assert.equal(message._id, mId)
                assert.equal(message.from, userBNativeId)
        
                resolve()
              }
            })

            const uB_D2_promise = new Promise((resolve, reject) => {
              samaClientB_Device2.onSystemMessageEvent = (message) => {
                assert.equal(message._id, mId)
                assert.equal(message.from, userBNativeId)
        
                resolve()
              }
            })

            await Promise.all([uA_D1_promise, uB_D2_promise])
          })
        })

        describe("U_B_D2 sender", () => {
          it("event to conversation", async () => {
            const mId = v4()
            samaClientB_Device2.messageSystem({ mid: mId, cid: TEST_U_CONV_ID, x: { four: '44' } })
      
            const uA_D1_promise = new Promise((resolve, reject) => {
              samaClientA_Device1.onSystemMessageEvent = (message) => {
                assert.equal(message._id, mId)
                assert.equal(message.from, userBNativeId)
        
                resolve()
              }
            })

            const uB_D1_promise = new Promise((resolve, reject) => {
              samaClientB_Device1.onSystemMessageEvent = (message) => {
                assert.equal(message._id, mId)
                assert.equal(message.from, userBNativeId)
        
                resolve()
              }
            })

            await Promise.all([uA_D1_promise, uB_D1_promise])
          })
        })
      })
    
      describe("Private", () => {
        describe("U_A_D1 -> U_B_D1,U_B_D2", () => {
          let messageId = void 0
    
          it("typing", async () => {
            samaClientA_Device1.sendTypingStatus({ cid: TEST_U_CONV_ID, status: 'start' })
      
            const uB_D1_promise = new Promise((resolve, reject) => {
              samaClientB_Device1.onUserTypingListener = (typing) => {
                assert.equal(typing.cid, TEST_U_CONV_ID)
                assert.equal(typing.from, userANativeId)
                resolve()
              }
            })

            const uB_D2_promise = new Promise((resolve, reject) => {
              samaClientB_Device2.onUserTypingListener = (typing) => {
                assert.equal(typing.cid, TEST_U_CONV_ID)
                assert.equal(typing.from, userANativeId)
                resolve()
              }
            })

            await Promise.all([uB_D1_promise, uB_D2_promise])
          })
      
          it("simple message", async () => {
            const mId = v4()
            const body = `Cluster Test Hello m: ${mId}`
            samaClientA_Device1.messageCreate({ cid: TEST_U_CONV_ID, body: body, mid: mId, x: { two: '2' } })

            const uB_D1_promise = new Promise((resolve, reject) => {
              samaClientB_Device1.onMessageEvent = (message) => {
                assert.equal(message.body, body)
                assert.equal(message.cid, TEST_U_CONV_ID)
                assert.equal(message.from, userANativeId)
                assert.equal(message.x['two'], '2')
      
                messageId = message._id
      
                resolve()
              }
            })

            const uB_D2_promise = new Promise((resolve, reject) => {
              samaClientB_Device2.onMessageEvent = (message) => {
                assert.equal(message.body, body)
                assert.equal(message.cid, TEST_U_CONV_ID)
                assert.equal(message.from, userANativeId)
                assert.equal(message.x['two'], '2')
      
                messageId = message._id

                resolve()
              }
            })

            await Promise.all([uB_D1_promise, uB_D2_promise])
          })
    
          it("read status", (done) => {
            console.log(messageId)
            samaClientB_Device2.markConversationAsRead({ cid: TEST_U_CONV_ID, mids: [messageId] })
      
            samaClientA_Device1.onMessageStatusListener = (status) => {
              assert.equal(status.ids.at(0), messageId)
              assert.equal(status.cid, TEST_U_CONV_ID)
              assert.equal(status.from, userBNativeId)
    
              done()
            }
          })
        })
    
        describe("U_B_D1 -> U_A_D1,U_B_D2", () => {
          let messageId = void 0
    
          it("typing", async () => {
            samaClientB_Device1.sendTypingStatus({ cid: TEST_U_CONV_ID, status: 'start' })

            const uA_D1_promise = new Promise((resolve, reject) => {
              samaClientA_Device1.onUserTypingListener = (typing) => {
                assert.equal(typing.cid, TEST_U_CONV_ID)
                assert.equal(typing.from, userBNativeId)
                resolve()
              }
            })

            const uB_D2_promise = new Promise((resolve, reject) => {
              samaClientB_Device2.onUserTypingListener = (typing) => {
                assert.equal(typing.cid, TEST_U_CONV_ID)
                assert.equal(typing.from, userBNativeId)
                resolve()
              }
            })

            await Promise.all([uA_D1_promise, uB_D2_promise])
          })
      
          it("simple message", async () => {
            const mId = v4()
            const body = `Cluster Test Hello m: ${mId}`
            samaClientB_Device1.messageCreate({ cid: TEST_U_CONV_ID, body: body, mid: mId, x: { two: '22' } })
      
            const uA_D1_promise = new Promise((resolve, reject) => {
              samaClientA_Device1.onMessageEvent = (message) => {
                assert.equal(message.body, body)
                assert.equal(message.cid, TEST_U_CONV_ID)
                assert.equal(message.from, userBNativeId)
                assert.equal(message.x['two'], '22')
      
                messageId = message._id
      
                resolve()
              }
            })

            const uB_D2_promise = new Promise((resolve, reject) => {
              samaClientB_Device2.onMessageEvent = (message) => {
                assert.equal(message.body, body)
                assert.equal(message.cid, TEST_U_CONV_ID)
                assert.equal(message.from, userBNativeId)
                assert.equal(message.x['two'], '22')
      
                messageId = message._id

                resolve()
              }
            })

            await Promise.all([uA_D1_promise, uB_D2_promise])
          })
    
          it("read status", async () => {
            samaClientA_Device1.markConversationAsRead({ cid: TEST_U_CONV_ID, mids: [messageId] })

            const uB_D1_promise = new Promise((resolve, reject) => {
              samaClientB_Device1.onMessageStatusListener = (status) => {
                assert.equal(status.ids.at(0), messageId)
                assert.equal(status.cid, TEST_U_CONV_ID)
                assert.equal(status.from, userANativeId)
      
                resolve()
              }
            })

            const uB_D2_promise = new Promise((resolve, reject) => {
              samaClientB_Device2.onMessageStatusListener = (status) => {
                assert.equal(status.ids.at(0), messageId)
                assert.equal(status.cid, TEST_U_CONV_ID)
                assert.equal(status.from, userANativeId)

                resolve()
              }
            })

            await Promise.all([uB_D1_promise, uB_D2_promise])
          })
        })
      })
    
      describe("Group", () => {
        describe("U_A_D1 -> U_B_D1,U_B_D2", () => {
          let messageId = void 0
    
          it("typing", async () => {
            samaClientA_Device1.sendTypingStatus({ cid: TEST_G_CONV_ID, status: 'start' })
      
            const uB_D1_promise = new Promise((resolve, reject) => {
              samaClientB_Device1.onUserTypingListener = (typing) => {
                assert.equal(typing.cid, TEST_G_CONV_ID)
                assert.equal(typing.from, userANativeId)
                resolve()
              }
            })

            const uB_D2_promise = new Promise((resolve, reject) => {
              samaClientB_Device2.onUserTypingListener = (typing) => {
                assert.equal(typing.cid, TEST_G_CONV_ID)
                assert.equal(typing.from, userANativeId)
                resolve()
              }
            })

            await Promise.all([uB_D1_promise, uB_D2_promise])
          })
      
          it("simple message", async () => {
            const mId = v4()
            const body = `Cluster Test Hello m: ${mId}`
            samaClientA_Device1.messageCreate({ cid: TEST_G_CONV_ID, body: body, mid: mId, x: { two: '2' } })

            const uB_D1_promise = new Promise((resolve, reject) => {
              samaClientB_Device1.onMessageEvent = (message) => {
                assert.equal(message.body, body)
                assert.equal(message.cid, TEST_G_CONV_ID)
                assert.equal(message.from, userANativeId)
                assert.equal(message.x['two'], '2')
      
                messageId = message._id
      
                resolve()
              }
            })

            const uB_D2_promise = new Promise((resolve, reject) => {
              samaClientB_Device2.onMessageEvent = (message) => {
                assert.equal(message.body, body)
                assert.equal(message.cid, TEST_G_CONV_ID)
                assert.equal(message.from, userANativeId)
                assert.equal(message.x['two'], '2')
      
                messageId = message._id

                resolve()
              }
            })

            await Promise.all([uB_D1_promise, uB_D2_promise])
          })
    
          it("read status", (done) => {
            console.log(messageId)
            samaClientB_Device2.markConversationAsRead({ cid: TEST_G_CONV_ID, mids: [messageId] })
      
            samaClientA_Device1.onMessageStatusListener = (status) => {
              assert.equal(status.ids.at(0), messageId)
              assert.equal(status.cid, TEST_G_CONV_ID)
              assert.equal(status.from, userBNativeId)
    
              done()
            }
          })
        })
    
        describe("U_B_D1 -> U_A_D1,U_B_D2", () => {
          let messageId = void 0
    
          it("typing", async () => {
            samaClientB_Device1.sendTypingStatus({ cid: TEST_G_CONV_ID, status: 'start' })

            const uA_D1_promise = new Promise((resolve, reject) => {
              samaClientA_Device1.onUserTypingListener = (typing) => {
                assert.equal(typing.cid, TEST_G_CONV_ID)
                assert.equal(typing.from, userBNativeId)
                resolve()
              }
            })

            const uB_D2_promise = new Promise((resolve, reject) => {
              samaClientB_Device2.onUserTypingListener = (typing) => {
                assert.equal(typing.cid, TEST_G_CONV_ID)
                assert.equal(typing.from, userBNativeId)
                resolve()
              }
            })

            await Promise.all([uA_D1_promise, uB_D2_promise])
          })
      
          it("simple message", async () => {
            const mId = v4()
            const body = `Cluster Test Hello m: ${mId}`
            samaClientB_Device1.messageCreate({ cid: TEST_G_CONV_ID, body: body, mid: mId, x: { two: '22' } })
      
            const uA_D1_promise = new Promise((resolve, reject) => {
              samaClientA_Device1.onMessageEvent = (message) => {
                assert.equal(message.body, body)
                assert.equal(message.cid, TEST_G_CONV_ID)
                assert.equal(message.from, userBNativeId)
                assert.equal(message.x['two'], '22')
      
                messageId = message._id
      
                resolve()
              }
            })

            const uB_D2_promise = new Promise((resolve, reject) => {
              samaClientB_Device2.onMessageEvent = (message) => {
                assert.equal(message.body, body)
                assert.equal(message.cid, TEST_G_CONV_ID)
                assert.equal(message.from, userBNativeId)
                assert.equal(message.x['two'], '22')
      
                messageId = message._id

                resolve()
              }
            })

            await Promise.all([uA_D1_promise, uB_D2_promise])
          })
    
          it("read status", async () => {
            samaClientA_Device1.markConversationAsRead({ cid: TEST_G_CONV_ID, mids: [messageId] })

            const uB_D1_promise = new Promise((resolve, reject) => {
              samaClientB_Device1.onMessageStatusListener = (status) => {
                assert.equal(status.ids.at(0), messageId)
                assert.equal(status.cid, TEST_G_CONV_ID)
                assert.equal(status.from, userANativeId)
      
                resolve()
              }
            })

            const uB_D2_promise = new Promise((resolve, reject) => {
              samaClientB_Device2.onMessageStatusListener = (status) => {
                assert.equal(status.ids.at(0), messageId)
                assert.equal(status.cid, TEST_G_CONV_ID)
                assert.equal(status.from, userANativeId)

                resolve()
              }
            })

            await Promise.all([uB_D1_promise, uB_D2_promise])
          })
        })
      })
    })
    
    describe("Activity on disconnect", () => {
      it("U_B_D1 logout (not last activity)", async () => {
        samaClientB_Device1.disconnect()

        const promise = new Promise((resolve, reject) => {
          setTimeout(() => resolve(), 500)

          samaClientA_Device1.onUserActivityListener = (activity) => {
            if (activity[userBNativeId] > 0) {
              reject(new Error("Should not be called"))
            }
          }
        })

        await promise
      })

      it("U_B_D1 logout (last activity)", (done) => {
        samaClientB_Device2.disconnect()

        samaClientA_Device1.onUserActivityListener = (activity) => {
          assert.ok(activity[userBNativeId] > 0)
          done()
        }
      })
    
      it("disconnect A", async () => {
        samaClientA_Device1.disconnect()
        await setTimeoutPromise(200)
      })
    })
  })
})