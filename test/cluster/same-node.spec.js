import assert from "node:assert"
import { setTimeout as setTimeoutPromise } from "node:timers/promises"

import { v4 } from "uuid"
import { SAMAClient } from "@sama-communications/sdk"

import {
  startOrAccessNodeA,
  TEST_ORG_ID, TEST_U_CONV_ID, TEST_G_CONV_ID,
  NODE_1_WS_ENDPOINT, NODE_1_HTTP_ENDPOINT,
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

const samaClientA = new SAMAClient(configNodeA)
const samaClientB = new SAMAClient(configNodeA)

let nodeA = void 0

describe("Same-node behavior", () => {
  before(async () => {
    console.log('[Before][same-node]')
  
    nodeA = await startOrAccessNodeA()
  })
  
  describe("Connect", () => {
    it("connect client A", async () => {
      await samaClientA.connect()
      await samaClientA.socketLogin({ user: { login: 'banshiAnton1', password: '12345678' }, deviceId: v4() })
    })
  
    it ("subscribe user B last activity", async () => {
      const activity = await samaClientA.subscribeToUserActivity(userBNativeId)
      assert.ok(activity[userBNativeId] > 0)
    })
  
    it("connect client B and check last activity", (done) => {
      samaClientB.connect().then(() => samaClientB.socketLogin({ user: { login: 'banshiAnton2', password: '12345678' }, deviceId: v4() }))
      samaClientA.onUserActivityListener = (activity) => {
        assert.equal(activity[userBNativeId], 0)
        done()
      }
    })
  
    it("subscribe user A last activity", async () => {
      const activity = await samaClientB.subscribeToUserActivity(userANativeId)
      assert.ok(activity[userANativeId] === 0)
    })
  })
  
  describe("Base messaging", () => {
    describe("System", () => {
      describe("A -> B", () => {
        it("event", (done) => {
          const mId = v4()
          samaClientA.messageSystem({ mid: mId, uids: [userBNativeId], x: { one: '1' } })
    
          samaClientB.onSystemMessageEvent = (message) => {
            assert.equal(message._id, mId)
            assert.equal(message.from, userANativeId)
    
            done()
          }
        })
      })
  
      describe("B -> A", () => {
        it("event", (done) => {
          const mId = v4()
          samaClientB.messageSystem({ mid: mId, uids: [userANativeId], x: { two: '2' } })
    
          samaClientA.onSystemMessageEvent = (message) => {
            assert.equal(message._id, mId)
            assert.equal(message.from, userBNativeId)
    
            done()
          }
        })
      })
    })
  
    describe("Private", () => {
      describe("A -> B", () => {
        let messageId = void 0
  
        it("typing", (done) => {
          samaClientA.sendTypingStatus({ cid: TEST_U_CONV_ID, status: 'start' })
    
          samaClientB.onUserTypingListener = (typing) => {
            assert.equal(typing.cid, TEST_U_CONV_ID)
            assert.equal(typing.from, userANativeId)
            done()
          }
        })
    
        it("simple message", (done) => {
          const mId = v4()
          const body = `Cluster Test Hello m: ${mId}`
          samaClientA.messageCreate({ cid: TEST_U_CONV_ID, body: body, mid: mId, x: { two: '2' } })
    
          samaClientB.onMessageEvent = (message) => {
            assert.equal(message.body, body)
            assert.equal(message.cid, TEST_U_CONV_ID)
            assert.equal(message.from, userANativeId)
            assert.equal(message.x['two'], '2')
  
            messageId = message._id
  
            done()
          }
        })
  
        it("read status", (done) => {
          samaClientB.markConversationAsRead({ cid: TEST_U_CONV_ID, mids: [messageId] })
    
          samaClientA.onMessageStatusListener = (status) => {
            assert.equal(status.ids.at(0), messageId)
            assert.equal(status.cid, TEST_U_CONV_ID)
            assert.equal(status.from, userBNativeId)
  
            done()
          }
        })
      })
  
      describe("B -> A", () => {
        let messageId = void 0
  
        it("typing", (done) => {
          samaClientB.sendTypingStatus({ cid: TEST_U_CONV_ID, status: 'start' })
    
          samaClientA.onUserTypingListener = (typing) => {
            assert.equal(typing.cid, TEST_U_CONV_ID)
            assert.equal(typing.from, userBNativeId)
            done()
          }
        })
    
        it("simple message", (done) => {
          const mId = v4()
          const body = `Cluster Test Hello m: ${mId}`
          samaClientB.messageCreate({ cid: TEST_U_CONV_ID, body: body, mid: mId, x: { two: '22' } })
    
          samaClientA.onMessageEvent = (message) => {
            assert.equal(message.body, body)
            assert.equal(message.cid, TEST_U_CONV_ID)
            assert.equal(message.from, userBNativeId)
            assert.equal(message.x['two'], '22')
  
            messageId = message._id
  
            done()
          }
        })
  
        it("read status", (done) => {
          samaClientA.markConversationAsRead({ cid: TEST_U_CONV_ID, mids: [messageId] })
    
          samaClientB.onMessageStatusListener = (status) => {
            assert.equal(status.ids.at(0), messageId)
            assert.equal(status.cid, TEST_U_CONV_ID)
            assert.equal(status.from, userANativeId)
  
            done()
          }
        })
      })
    })
  
    describe("Group", () => {
      describe("A -> B", () => {
        let messageId = void 0
  
        it("typing", (done) => {
          samaClientA.sendTypingStatus({ cid: TEST_G_CONV_ID, status: 'start' })
    
          samaClientB.onUserTypingListener = (typing) => {
            assert.equal(typing.cid, TEST_G_CONV_ID)
            assert.equal(typing.from, userANativeId)
            done()
          }
        })
    
        it("simple message", (done) => {
          const mId = v4()
          const body = `Cluster Test Hello m: ${mId}`
          samaClientA.messageCreate({ cid: TEST_G_CONV_ID, body: body, mid: mId, x: { one: '1' } })
    
          samaClientB.onMessageEvent = (message) => {
            assert.equal(message.body, body)
            assert.equal(message.cid, TEST_G_CONV_ID)
            assert.equal(message.from, userANativeId)
            assert.equal(message.x['one'], '1')
  
            messageId = message._id
  
            done()
          }
        })
  
        it("read status", (done) => {
          samaClientB.markConversationAsRead({ cid: TEST_G_CONV_ID, mids: [messageId] })
    
          samaClientA.onMessageStatusListener = (status) => {
            assert.equal(status.ids.at(0), messageId)
            assert.equal(status.cid, TEST_G_CONV_ID)
            assert.equal(status.from, userBNativeId)
  
            done()
          }
        })
      })
  
      describe("B -> A", () => {
        let messageId = void 0
  
        it("typing", (done) => {
          samaClientB.sendTypingStatus({ cid: TEST_G_CONV_ID, status: 'start' })
    
          samaClientA.onUserTypingListener = (typing) => {
            assert.equal(typing.cid, TEST_G_CONV_ID)
            assert.equal(typing.from, userBNativeId)
            done()
          }
        })
    
        it("simple message", (done) => {
          const mId = v4()
          const body = `Cluster Test Hello m: ${mId}`
          samaClientB.messageCreate({ cid: TEST_G_CONV_ID, body: body, mid: mId, x: { one: '11' } })
    
          samaClientA.onMessageEvent = (message) => {
            assert.equal(message.body, body)
            assert.equal(message.cid, TEST_G_CONV_ID)
            assert.equal(message.from, userBNativeId)
            assert.equal(message.x['one'], '11')
  
            messageId = message._id
  
            done()
          }
        })
  
        it("read status", (done) => {
          samaClientA.markConversationAsRead({ cid: TEST_G_CONV_ID, mids: [messageId] })
    
          samaClientB.onMessageStatusListener = (status) => {
            assert.equal(status.ids.at(0), messageId)
            assert.equal(status.cid, TEST_G_CONV_ID)
            assert.equal(status.from, userANativeId)
  
            done()
          }
        })
      })
    })
  })
  
  describe("Activity on disconnect", () => {
    it("user A logout", (done) => {
      samaClientA.disconnect()
  
      samaClientB.onUserActivityListener = (activity) => {
        assert.ok(activity[userANativeId] > 0)
        done()
      }
    })
  
    it("disconnect B", async () => {
      samaClientB.disconnect()
      await setTimeoutPromise(200)
    })
  })
})