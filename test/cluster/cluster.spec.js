import { spawn } from "node:child_process"
import { Transform } from "node:stream"
import process from "node:process"

import { v4 } from "uuid"
import { SAMAClient } from "@sama-communications/sdk"
import assert from "node:assert"

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

let userANativeId = void 0
let userBNativeId = void 0

describe("Connect", () => {
  it("connect client A", async () => {
    await samaClientA.connect()
    const user = await samaClientA.socketLogin({ user: { login: 'banshiAnton1', password: '12345678' }, deviceId: v4() })
    userANativeId = user.native_id
  })

  it("connect client B", async () => {
    await samaClientB.connect()
    const user = await samaClientB.socketLogin({ user: { login: 'banshiAnton2', password: '12345678' }, deviceId: v4() })
    userBNativeId = user.native_id
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
        samaClientA.messageCreate({ cid: process.env.TEST_U_CONV_ID, body: body, mid: mId })
  
        samaClientB.onMessageEvent = (message) => {
          assert.equal(message.body, body)
          assert.equal(message.cid, process.env.TEST_U_CONV_ID)
          assert.equal(message.from, userANativeId)

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
        samaClientB.messageCreate({ cid: process.env.TEST_U_CONV_ID, body: body, mid: mId })
  
        samaClientA.onMessageEvent = (message) => {
          assert.equal(message.body, body)
          assert.equal(message.cid, process.env.TEST_U_CONV_ID)
          assert.equal(message.from, userBNativeId)

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
})

const onExit = () => {
  nodeA.kill()
  nodeB.kill()
}

process.on('SIGTERM', onExit)

after(onExit)