import assert from "node:assert"
import { spawn } from "node:child_process"
import { Transform } from "node:stream"
import process from "node:process"
import { setTimeout as setTimeoutPromise } from "node:timers/promises"

import { v4 } from "uuid"
import { SAMAClient } from "@sama-communications/sdk"

console.log(process.env.RUN_NODE_1_CMD, process.env.RUN_NODE_2_CMD)

const createTransformStream = (prefix, nodeSubprocess) => new (class extends Transform {
  _transform(chunk, encoding, cb) {
    const withPrefixChunk = `|-${prefix}-|${chunk}`
    cb(void 0, withPrefixChunk)

    if (chunk.includes('[TCP] listening on port')) {
      nodeSubprocess.emit('node_ready', nodeSubprocess)
    }
  }
})

const nodeA = spawn(process.env.RUN_NODE_1_CMD, [], {
  shell: true,
  stdio: ['ignore', 'pipe', 'pipe']
})

const nodeAReadyPromise = new Promise((resolve, reject) => {
  const rejectTimerId = setTimeout(() => reject(new Error('Timeout')), 5_000)

  nodeA.once('node_ready', (nodeSubprocess) => {
    console.log('[Node][Ready]', nodeSubprocess.pid)
    resolve(nodeSubprocess)
    clearTimeout(rejectTimerId)
  })
})

nodeA.stdout.pipe(createTransformStream('NODE_A', nodeA)).pipe(process.stdout)
nodeA.stderr.pipe(createTransformStream('NODE_A', nodeA)).pipe(process.stderr)

await nodeAReadyPromise

const nodeB = spawn(process.env.RUN_NODE_2_CMD, [], {
  shell: true,
  stdio: ['ignore', 'pipe', 'pipe']
})

const nodeBReadyPromise = new Promise((resolve, reject) => {
  const rejectTimerId = setTimeout(() => reject(new Error('Timeout')), 5_000)

  nodeB.once('node_ready', (nodeSubprocess) => {
    console.log('[Node][Ready]', nodeSubprocess.pid)
    resolve(nodeSubprocess)
    clearTimeout(rejectTimerId)
  })
})

nodeB.stdout.pipe(createTransformStream('NODE_B', nodeB)).pipe(process.stdout)
nodeB.stderr.pipe(createTransformStream('NODE_B', nodeB)).pipe(process.stderr)

await nodeBReadyPromise

console.log("\n=== SETUP FINISHED ===\n")

const configNodeA = {
  endpoint: {
    ws: process.env.NODE_1_WS_ENDPOINT,
    http: process.env.NODE_1_HTTP_ENDPOINT,
  },
  organization_id: process.env.TEST_ORG_ID,
  disableAutoReconnect: true,
}

const configNodeB = {
  endpoint: {
    ws: process.env.NODE_2_WS_ENDPOINT,
    http: process.env.NODE_2_HTTP_ENDPOINT,
  },
  organization_id: process.env.TEST_ORG_ID,
  disableAutoReconnect: true,
}

const samaClientA = new SAMAClient(configNodeA)
const samaClientB = new SAMAClient(configNodeB)

let userANativeId = '69cbe9757fc0a44161188215'
let userBNativeId = '69cbe9a27fc0a44161188218'

describe("Connect", () => {
  it("connect client A", async () => {
    await samaClientA.connect()
    const user = await samaClientA.socketLogin({ user: { login: 'banshiAnton1', password: '12345678' }, deviceId: v4() })
    userANativeId = user.native_id
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
        samaClientA.sendTypingStatus({ cid: process.env.TEST_U_CONV_ID, status: 'start' })
  
        samaClientB.onUserTypingListener = (typing) => {
          assert.equal(typing.cid, process.env.TEST_U_CONV_ID)
          assert.equal(typing.from, userANativeId)
          done()
        }
      })
  
      it("simple message", (done) => {
        const mId = v4()
        const body = `Cluster Test Hello m: ${mId}`
        samaClientA.messageCreate({ cid: process.env.TEST_U_CONV_ID, body: body, mid: mId, x: { two: '2' } })
  
        samaClientB.onMessageEvent = (message) => {
          assert.equal(message.body, body)
          assert.equal(message.cid, process.env.TEST_U_CONV_ID)
          assert.equal(message.from, userANativeId)
          assert.equal(message.x['two'], '2')

          messageId = message._id

          done()
        }
      })

      it("read status", (done) => {
        samaClientB.markConversationAsRead({ cid: process.env.TEST_U_CONV_ID, mids: [messageId] })
  
        samaClientA.onMessageStatusListener = (status) => {
          assert.equal(status.ids.at(0), messageId)
          assert.equal(status.cid, process.env.TEST_U_CONV_ID)
          assert.equal(status.from, userBNativeId)

          done()
        }
      })
    })

    describe("B -> A", () => {
      let messageId = void 0

      it("typing", (done) => {
        samaClientB.sendTypingStatus({ cid: process.env.TEST_U_CONV_ID, status: 'start' })
  
        samaClientA.onUserTypingListener = (typing) => {
          assert.equal(typing.cid, process.env.TEST_U_CONV_ID)
          assert.equal(typing.from, userBNativeId)
          done()
        }
      })
  
      it("simple message", (done) => {
        const mId = v4()
        const body = `Cluster Test Hello m: ${mId}`
        samaClientB.messageCreate({ cid: process.env.TEST_U_CONV_ID, body: body, mid: mId, x: { two: '22' } })
  
        samaClientA.onMessageEvent = (message) => {
          assert.equal(message.body, body)
          assert.equal(message.cid, process.env.TEST_U_CONV_ID)
          assert.equal(message.from, userBNativeId)
          assert.equal(message.x['two'], '22')

          messageId = message._id

          done()
        }
      })

      it("read status", (done) => {
        samaClientA.markConversationAsRead({ cid: process.env.TEST_U_CONV_ID, mids: [messageId] })
  
        samaClientB.onMessageStatusListener = (status) => {
          assert.equal(status.ids.at(0), messageId)
          assert.equal(status.cid, process.env.TEST_U_CONV_ID)
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
        samaClientA.sendTypingStatus({ cid: process.env.TEST_G_CONV_ID, status: 'start' })
  
        samaClientB.onUserTypingListener = (typing) => {
          assert.equal(typing.cid, process.env.TEST_G_CONV_ID)
          assert.equal(typing.from, userANativeId)
          done()
        }
      })
  
      it("simple message", (done) => {
        const mId = v4()
        const body = `Cluster Test Hello m: ${mId}`
        samaClientA.messageCreate({ cid: process.env.TEST_G_CONV_ID, body: body, mid: mId, x: { one: '1' } })
  
        samaClientB.onMessageEvent = (message) => {
          assert.equal(message.body, body)
          assert.equal(message.cid, process.env.TEST_G_CONV_ID)
          assert.equal(message.from, userANativeId)
          assert.equal(message.x['one'], '1')

          messageId = message._id

          done()
        }
      })

      it("read status", (done) => {
        samaClientB.markConversationAsRead({ cid: process.env.TEST_G_CONV_ID, mids: [messageId] })
  
        samaClientA.onMessageStatusListener = (status) => {
          assert.equal(status.ids.at(0), messageId)
          assert.equal(status.cid, process.env.TEST_G_CONV_ID)
          assert.equal(status.from, userBNativeId)

          done()
        }
      })
    })

    describe("B -> A", () => {
      let messageId = void 0

      it("typing", (done) => {
        samaClientB.sendTypingStatus({ cid: process.env.TEST_G_CONV_ID, status: 'start' })
  
        samaClientA.onUserTypingListener = (typing) => {
          assert.equal(typing.cid, process.env.TEST_G_CONV_ID)
          assert.equal(typing.from, userBNativeId)
          done()
        }
      })
  
      it("simple message", (done) => {
        const mId = v4()
        const body = `Cluster Test Hello m: ${mId}`
        samaClientB.messageCreate({ cid: process.env.TEST_G_CONV_ID, body: body, mid: mId, x: { one: '11' } })
  
        samaClientA.onMessageEvent = (message) => {
          assert.equal(message.body, body)
          assert.equal(message.cid, process.env.TEST_G_CONV_ID)
          assert.equal(message.from, userBNativeId)
          assert.equal(message.x['one'], '11')

          messageId = message._id

          done()
        }
      })

      it("read status", (done) => {
        samaClientA.markConversationAsRead({ cid: process.env.TEST_G_CONV_ID, mids: [messageId] })
  
        samaClientB.onMessageStatusListener = (status) => {
          assert.equal(status.ids.at(0), messageId)
          assert.equal(status.cid, process.env.TEST_G_CONV_ID)
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

const onExit = () => {
  nodeA.kill()
  nodeB.kill()
}

process.on('SIGTERM', onExit)

after(onExit)