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

const samaClientA = new SAMAClient(configNodeA)
const samaClientB = new SAMAClient(configNodeB)

let nodeA = void 0
let nodeB = void 0

describe("Cross-node behavior:", () => {
  before(async () => {
    console.log('[Before][node-crash]')
  
    nodeA = await startOrAccessNodeA()
    nodeB = await startOrAccessNodeB()

    await setTimeoutPromise(500)
  })

  describe("NodeA(U_A) - NodeB(U_B) - NodeB crash:", () => {
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

    it("messaging A -> B", (done) => {
      const mId = v4()
      const body = `Cluster Test Hello m: ${mId}`
      samaClientA.messageCreate({ cid: TEST_G_CONV_ID, body: body, mid: mId, x: { two: '2' } })

      samaClientB.onMessageEvent = (message) => {
        assert.equal(message.body, body)
        assert.equal(message.cid, TEST_G_CONV_ID)
        assert.equal(message.from, userANativeId)
        assert.equal(message.x['two'], '2')

        done()
      }
    })

    it("messaging B -> A", (done) => {
      const mId = v4()
      const body = `Cluster Test Hello m: ${mId}`
      samaClientB.messageCreate({ cid: TEST_G_CONV_ID, body: body, mid: mId, x: { two: '22' } })

      samaClientA.onMessageEvent = (message) => {
        assert.equal(message.body, body)
        assert.equal(message.cid, TEST_G_CONV_ID)
        assert.equal(message.from, userBNativeId)
        assert.equal(message.x['two'], '22')

        done()
      }
    })

    it("kill NodeB events with U_B last activity from NodeA", async () => {
      const closePromise = new Promise((resolve, reject) => {
        nodeA.once(`node_close[${nodeB.clusterEndpoint}]`, () => {
          console.log('[node][close]', nodeB.clusterEndpoint)
          resolve()
        })
      })

      const startReconnectPromise = new Promise((resolve, reject) => {
        nodeA.once(`node_reconnect_start[${nodeB.clusterEndpoint}]`, () => {
          console.log('[node][reconnect][start]', nodeB.clusterEndpoint)
          resolve()
        })
      })

      const cleanNodeBPromise = new Promise((resolve, reject) => {
        nodeA.once(`node_clean[${nodeB.clusterEndpoint}]`, () => {
          console.log('[node][clean]', nodeB.clusterEndpoint)
          resolve()
        })
      })

      const userBOfflinePromise = new Promise((resolve, reject) => {
        samaClientA.onUserActivityListener = async (activity) => {
          assert.ok(activity[userBNativeId] > 0)

          activity = await samaClientA.subscribeToUserActivity(userBNativeId)
          assert.ok(activity[userBNativeId] > 0)

          resolve()
        }
      })

      nodeB.kill()

      await Promise.all([closePromise, startReconnectPromise, cleanNodeBPromise, userBOfflinePromise])
    })

    describe("Run new NodeB and reconnect U_B", () => {
      it("start new NodeB", async () => {
        nodeB = await startOrAccessNodeB(void 0, true)
      })

      it("connect client B and check last activity", (done) => {
        samaClientB.connect().then(() => samaClientB.socketLogin({ user: { login: 'banshiAnton2', password: '12345678' }, deviceId: v4() }))
        samaClientA.onUserActivityListener = (activity) => {
          assert.equal(activity[userBNativeId], 0)
          done()
        }
      })

      describe("it can send message to each other:", () => {
        it("A -> B", (done) => {
          const mId = v4()
          const body = `Cluster Test Hello m: ${mId}`
          samaClientA.messageCreate({ cid: TEST_G_CONV_ID, body: body, mid: mId, x: { two: '2' } })
    
          samaClientB.onMessageEvent = (message) => {
            assert.equal(message.body, body)
            assert.equal(message.cid, TEST_G_CONV_ID)
            assert.equal(message.from, userANativeId)
            assert.equal(message.x['two'], '2')
    
            done()
          }
        })
  
        it("B -> A", (done) => {
          const mId = v4()
          const body = `Cluster Test Hello m: ${mId}`
          samaClientB.messageCreate({ cid: TEST_G_CONV_ID, body: body, mid: mId, x: { two: '22' } })
    
          samaClientA.onMessageEvent = (message) => {
            assert.equal(message.body, body)
            assert.equal(message.cid, TEST_G_CONV_ID)
            assert.equal(message.from, userBNativeId)
            assert.equal(message.x['two'], '22')
    
            done()
          }
        })
      })
    })
  })
})