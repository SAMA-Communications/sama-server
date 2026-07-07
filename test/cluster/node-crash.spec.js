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
let samaClientB_Device2 = void 0

let userAToken = void 0
let userBToken = void 0

let nodeA = void 0
let nodeB = void 0

describe("Crash Node behavior:", () => {
  before(async () => {
    console.log("[Before][node-crash]")

    configNodeA.organization_id = dummyDataTestConfig.organizationId
    configNodeB.organization_id = dummyDataTestConfig.organizationId

    samaClientA = new SAMAClient(configNodeA)
    samaClientA.deviceId = v4()
    samaClientB = new SAMAClient(configNodeB)
    samaClientB.deviceId = v4()
    samaClientB_Device2 = new SAMAClient(configNodeA)
    samaClientB_Device2.deviceId = v4()

    nodeA = await startOrAccessNodeA()
    nodeB = await startOrAccessNodeB()

    await setTimeoutPromise(500)
  })

  describe("NodeA(userA) - NodeB(userB) - NodeB crash (wait fro clean):", () => {
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

    describe("Messaging:", () => {
      it("userA -> userB", (done) => {
        const mId = v4()
        const body = `Cluster Test Hello m: ${mId}`
        samaClientA.messageCreate({ cid: dummyDataTestConfig.conversations.group.nativeId, body: body, mid: mId, x: { two: "2" } })

        samaClientB.onMessageEvent = (message) => {
          assert.equal(message.body, body)
          assert.equal(message.cid, dummyDataTestConfig.conversations.group.nativeId)
          assert.equal(message.from, dummyDataTestConfig.users.userA.nativeId)
          assert.equal(message.x["two"], "2")

          done()
        }
      })

      it("userB -> userA", (done) => {
        const mId = v4()
        const body = `Cluster Test Hello m: ${mId}`
        samaClientB.messageCreate({ cid: dummyDataTestConfig.conversations.group.nativeId, body: body, mid: mId, x: { two: "22" } })

        samaClientA.onMessageEvent = (message) => {
          assert.equal(message.body, body)
          assert.equal(message.cid, dummyDataTestConfig.conversations.group.nativeId)
          assert.equal(message.from, dummyDataTestConfig.users.userB.nativeId)
          assert.equal(message.x["two"], "22")

          done()
        }
      })
    })

    describe("NodeB Crash", () => {
      it("kill NodeB and wait events userB last activity to NodeA", async () => {
        const closePromise = new Promise((resolve, reject) => {
          nodeA.once(`node_close[${nodeB.clusterEndpoint}]`, () => {
            console.log("[node][close]", nodeB.clusterEndpoint)
            resolve()
          })
        })

        const startReconnectPromise = new Promise((resolve, reject) => {
          nodeA.once(`node_reconnect_start[${nodeB.clusterEndpoint}]`, () => {
            console.log("[node][reconnect][start]", nodeB.clusterEndpoint)
            resolve()
          })
        })

        const cleanNodeBPromise = new Promise((resolve, reject) => {
          nodeA.once(`node_clean[${nodeB.clusterEndpoint}]`, () => {
            console.log("[node][clean]", nodeB.clusterEndpoint)
            resolve()
          })
        })

        const userBOfflinePromise = new Promise((resolve, reject) => {
          samaClientA.onUserActivityListener = async (activity) => {
            assert.ok(activity[dummyDataTestConfig.users.userB.nativeId] > 0)

            activity = await samaClientA.subscribeToUserActivity(dummyDataTestConfig.users.userB.nativeId)
            assert.ok(activity[dummyDataTestConfig.users.userB.nativeId] > 0)

            resolve()
          }
        })

        nodeB.kill()

        await Promise.all([closePromise, startReconnectPromise, cleanNodeBPromise, userBOfflinePromise])
      })
    })

    describe("Run new NodeB and reconnect userB", () => {
      it("start new NodeB", async () => {
        nodeB = await startOrAccessNodeB(true)

        const nodeReadyPromise = new Promise((resolve, reject) => {
          nodeB.once("node_ready", (nodeClusterWsEndpoint) => {
            nodeB.clusterEndpoint = nodeClusterWsEndpoint
            console.log("[node][ready]", nodeB.pid, nodeB.clusterEndpoint)
            resolve()
          })
        })

        const nodeHandShackedPromise = new Promise((resolve, reject) => {
          nodeB.once(`node_connected[${nodeA.clusterEndpoint}]`, (nodeClusterWsEndpoint) => {
            console.log("[node][connected]", nodeClusterWsEndpoint)
            resolve()
          })
        })

        await Promise.all([nodeReadyPromise, nodeHandShackedPromise])
      })

      it("connect client userB and check last activity", (done) => {
        samaClientB
          .connect()
          .then(() => samaClientB.socketLogin({ token: userBToken }))
          .then(({ token }) => (userBToken = token))
        samaClientA.onUserActivityListener = (activity) => {
          assert.equal(activity[dummyDataTestConfig.users.userB.nativeId], 0)
          done()
        }
      })

      describe("it can send message to each other:", () => {
        it("userA -> userB", (done) => {
          const mId = v4()
          const body = `Cluster Test Hello m: ${mId}`
          samaClientA.messageCreate({ cid: dummyDataTestConfig.conversations.group.nativeId, body: body, mid: mId, x: { two: "2" } })

          samaClientB.onMessageEvent = (message) => {
            assert.equal(message.body, body)
            assert.equal(message.cid, dummyDataTestConfig.conversations.group.nativeId)
            assert.equal(message.from, dummyDataTestConfig.users.userA.nativeId)
            assert.equal(message.x["two"], "2")

            done()
          }
        })

        it("userB -> userA", (done) => {
          const mId = v4()
          const body = `Cluster Test Hello m: ${mId}`
          samaClientB.messageCreate({ cid: dummyDataTestConfig.conversations.group.nativeId, body: body, mid: mId, x: { two: "22" } })

          samaClientA.onMessageEvent = (message) => {
            assert.equal(message.body, body)
            assert.equal(message.cid, dummyDataTestConfig.conversations.group.nativeId)
            assert.equal(message.from, dummyDataTestConfig.users.userB.nativeId)
            assert.equal(message.x["two"], "22")

            done()
          }
        })
      })
    })
  })

  describe("NodeA(userA) - NodeB(userB) - NodeA restarting", () => {
    it("NodeA crash", async () => {
      const closePromise = new Promise((resolve, reject) => {
        nodeB.once(`node_close[${nodeA.clusterEndpoint}]`, () => {
          console.log("[node][close]", nodeA.clusterEndpoint)
          resolve()
        })
      })

      const startReconnectPromise = new Promise((resolve, reject) => {
        nodeB.once(`node_reconnect_start[${nodeA.clusterEndpoint}]`, () => {
          console.log("[node][reconnect][start]", nodeA.clusterEndpoint)
          resolve()
        })
      })

      nodeA.kill()

      await Promise.all([closePromise, startReconnectPromise])
    })

    it("check last activity userA", async () => {
      const activity = await samaClientB.subscribeToUserActivity(dummyDataTestConfig.users.userA.nativeId)
      assert.ok(activity[dummyDataTestConfig.users.userA.nativeId] === 0)
    })

    it("restart NodeA (same cluster port)", async () => {
      const nodeAClusterEndpoint = nodeA.clusterEndpoint

      const finishReconnectPromise = new Promise((resolve, reject) => {
        nodeB.once(`node_reconnect_finish[${nodeAClusterEndpoint}]`, () => {
          console.log("[node][reconnect][finish]", nodeAClusterEndpoint)
          resolve()
        })
      })

      const { port } = new URL(nodeAClusterEndpoint)
      const nodeEnv = { APP_CLUSTER_PORT: `${port}` }

      nodeA = await startOrAccessNodeA(false, nodeEnv)

      await finishReconnectPromise
    })

    it("connect userA to NodeA", (done) => {
      samaClientA
        .connect()
        .then(() => samaClientA.socketLogin({ token: userAToken }))
        .then(({ token }) => (userAToken = token))

      samaClientB.onUserActivityListener = (activity) => {
        assert.equal(activity[dummyDataTestConfig.users.userA.nativeId], 0)
        done()
      }
    })

    describe("it can send message to each other:", () => {
      it("userA -> userB", (done) => {
        const mId = v4()
        const body = `Cluster Test Hello m: ${mId}`
        samaClientA.messageCreate({ cid: dummyDataTestConfig.conversations.group.nativeId, body: body, mid: mId, x: { two: "2" } })

        samaClientB.onMessageEvent = (message) => {
          assert.equal(message.body, body)
          assert.equal(message.cid, dummyDataTestConfig.conversations.group.nativeId)
          assert.equal(message.from, dummyDataTestConfig.users.userA.nativeId)
          assert.equal(message.x["two"], "2")

          done()
        }
      })

      it("userB -> userA", (done) => {
        const mId = v4()
        const body = `Cluster Test Hello m: ${mId}`
        samaClientB.messageCreate({ cid: dummyDataTestConfig.conversations.group.nativeId, body: body, mid: mId, x: { two: "22" } })

        samaClientA.onMessageEvent = (message) => {
          assert.equal(message.body, body)
          assert.equal(message.cid, dummyDataTestConfig.conversations.group.nativeId)
          assert.equal(message.from, dummyDataTestConfig.users.userB.nativeId)
          assert.equal(message.x["two"], "22")

          done()
        }
      })
    })
  })

  describe("NodeA(userA,userB_Device2) - NodeB(userB_Device1) - NodeB Crush check last activity behavior:", () => {
    describe("Connect userB_Device2", () => {
      it("subscribe last activity userB", async () => {
        const activity = await samaClientA.subscribeToUserActivity(dummyDataTestConfig.users.userB.nativeId)
        assert.ok(activity[dummyDataTestConfig.users.userB.nativeId] === 0)
      })

      it("connect userB_Device2 to NodeA", (done) => {
        samaClientB_Device2
          .connect()
          .then(() => samaClientB_Device2.socketLogin({ user: { login: dummyDataTestConfig.users.userB.login, password: userPassword } }))

        samaClientA.onUserActivityListener = (activity) => {
          assert.equal(activity[dummyDataTestConfig.users.userB.nativeId], 0)
          done()
        }
      })
    })

    describe("kill NodeB check last activity behavior", () => {
      it("kill NodeB wait no last activity", async () => {
        const closePromise = new Promise((resolve, reject) => {
          nodeA.once(`node_close[${nodeB.clusterEndpoint}]`, () => {
            console.log("[node][close]", nodeB.clusterEndpoint)
            resolve()
          })
        })

        const startReconnectPromise = new Promise((resolve, reject) => {
          nodeA.once(`node_reconnect_start[${nodeB.clusterEndpoint}]`, () => {
            console.log("[node][reconnect][start]", nodeB.clusterEndpoint)
            resolve()
          })
        })

        const cleanNodeBPromise = new Promise((resolve, reject) => {
          nodeA.once(`node_clean[${nodeB.clusterEndpoint}]`, () => {
            console.log("[node][clean]", nodeB.clusterEndpoint)
            resolve()
          })
        })

        const userBNoOfflinePromise = new Promise((resolve, reject) => {
          cleanNodeBPromise.then(() => setTimeoutPromise(1_000)).then(() => resolve())

          samaClientA.onUserActivityListener = async (activity) => {
            if (activity[dummyDataTestConfig.users.userB.nativeId] > 0) {
              reject(new Error("Should not be called"))
            }
          }
        })

        nodeB.kill()

        await Promise.all([closePromise, startReconnectPromise, cleanNodeBPromise, userBNoOfflinePromise])
      })

      it("check userB activity", async () => {
        const activity = await samaClientA.subscribeToUserActivity(dummyDataTestConfig.users.userB.nativeId)
        assert.ok(activity[dummyDataTestConfig.users.userB.nativeId] === 0)
      })

      it("close last userB connection on NodeA", (done) => {
        samaClientB_Device2.disconnect()

        samaClientA.onUserActivityListener = (activity) => {
          assert.ok(activity[dummyDataTestConfig.users.userB.nativeId] > 0)
          done()
        }
      })
    })

    describe("Start new NodeB", () => {
      it("start", async () => {
        nodeB = await startOrAccessNodeB()

        await setTimeoutPromise(500)
      })

      it("connect userB", (done) => {
        samaClientB.connect().then(() => samaClientB.socketLogin({ token: userBToken }))
        samaClientA.onUserActivityListener = (activity) => {
          assert.equal(activity[dummyDataTestConfig.users.userB.nativeId], 0)
          done()
        }
      })
    })
  })

  describe("NodeA(userA) - NodeB(userB) - NodeA crush - userA connect to NodeB:", () => {
    it("crash NodeA", async () => {
      const closePromise = new Promise((resolve, reject) => {
        nodeB.once(`node_close[${nodeA.clusterEndpoint}]`, () => {
          console.log("[node][close]", nodeA.clusterEndpoint)
          resolve()
        })
      })

      const startReconnectPromise = new Promise((resolve, reject) => {
        nodeB.once(`node_reconnect_start[${nodeA.clusterEndpoint}]`, () => {
          console.log("[node][reconnect][start]", nodeA.clusterEndpoint)
          resolve()
        })
      })

      nodeA.kill()

      await Promise.all([closePromise, startReconnectPromise])
    })

    it("subscribe last activity userB to userA", async () => {
      const activity = await samaClientB.subscribeToUserActivity(dummyDataTestConfig.users.userA.nativeId)
      assert.ok(activity[dummyDataTestConfig.users.userA.nativeId] === 0)
    })

    it("connect userA to NodeB", (done) => {
      samaClientA.connect(NODE_2_WS_ENDPOINT, NODE_2_HTTP_ENDPOINT).then(() => samaClientA.socketLogin({ token: userAToken }))
      samaClientB.onUserActivityListener = (activity) => {
        assert.equal(activity[dummyDataTestConfig.users.userA.nativeId], 0)
        done()
      }
    })

    describe("it can send message to each other:", () => {
      it("userA -> userB", (done) => {
        const mId = v4()
        const body = `Cluster Test Hello m: ${mId}`
        samaClientA.messageCreate({ cid: dummyDataTestConfig.conversations.group.nativeId, body: body, mid: mId, x: { two: "2" } })

        samaClientB.onMessageEvent = (message) => {
          assert.equal(message.body, body)
          assert.equal(message.cid, dummyDataTestConfig.conversations.group.nativeId)
          assert.equal(message.from, dummyDataTestConfig.users.userA.nativeId)
          assert.equal(message.x["two"], "2")

          done()
        }
      })

      it("userB -> userA", (done) => {
        const mId = v4()
        const body = `Cluster Test Hello m: ${mId}`
        samaClientB.messageCreate({ cid: dummyDataTestConfig.conversations.group.nativeId, body: body, mid: mId, x: { two: "22" } })

        samaClientA.onMessageEvent = (message) => {
          assert.equal(message.body, body)
          assert.equal(message.cid, dummyDataTestConfig.conversations.group.nativeId)
          assert.equal(message.from, dummyDataTestConfig.users.userB.nativeId)
          assert.equal(message.x["two"], "22")

          done()
        }
      })
    })
  })
})
