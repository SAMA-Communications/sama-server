import { spawn } from "node:child_process"
import { Transform } from "node:stream"
import { setTimeout as setTimeoutPromise } from "node:timers/promises"
import process from "node:process"

import { faker } from "@faker-js/faker"
import { SAMAClient } from "@sama-communications/sdk"
import { v4 } from "uuid"

export const RUN_NODE_1_CMD = process.env.RUN_NODE_1_CMD
export const RUN_NODE_2_CMD = process.env.RUN_NODE_2_CMD

export const NODE_1_WS_ENDPOINT = process.env.NODE_1_WS_ENDPOINT
export const NODE_2_WS_ENDPOINT = process.env.NODE_2_WS_ENDPOINT
export const NODE_1_HTTP_ENDPOINT = process.env.NODE_1_HTTP_ENDPOINT
export const NODE_2_HTTP_ENDPOINT = process.env.NODE_2_HTTP_ENDPOINT

export const userPassword = "12345678"
export const dummyDataTestConfig = {
  organizationId: void 0,
  users: {
    user1: { nativeId: void 0, login: void 0, password: userPassword },
    user2: { nativeId: void 0, login: void 0, password: userPassword },
  },
  conversations: {
    private: { nativeId: void 0 },
    group: { nativeId: void 0 },
  },
}

let nodeA = void 0
let nodeB = void 0

// ws endpoint reg: /wss?:\/\/wss?:\/\/.+\//

const createPipeStream = (tag, nodeSubprocess) =>
  new (class extends Transform {
    _transform(chunk, encoding, cb) {
      chunk = chunk.toString()
      const withPrefixChunk = `|-${tag}-|${chunk}`
      cb(void 0, withPrefixChunk)

      let regResult = chunk.match(/\[Ready\] cluster-ws: (wss?:\/\/.+\/)/)
      if (regResult) {
        const nodeClusterWsEndpoint = regResult.at(1)
        nodeSubprocess.emit("node_ready", nodeClusterWsEndpoint)
      }

      regResult = chunk.match(/\[node handshake finished\] (wss?:\/\/.+\/)/)
      if (regResult) {
        const nodeClusterWsEndpoint = regResult.at(1)
        nodeSubprocess.emit(`node_connected[${nodeClusterWsEndpoint}]`, nodeClusterWsEndpoint)
      }

      regResult = chunk.match(/\[clean node\] (wss?:\/\/.+\/)/)
      if (regResult) {
        const nodeClusterWsEndpoint = regResult.at(1)
        nodeSubprocess.emit(`node_clean[${nodeClusterWsEndpoint}]`, nodeClusterWsEndpoint)
      }

      regResult = chunk.match(/\[Close\]\[(wss?:\/\/.+\/)\] IsWasOpened/)
      if (regResult) {
        const nodeClusterWsEndpoint = regResult.at(1)
        nodeSubprocess.emit(`node_close[${nodeClusterWsEndpoint}]`, nodeClusterWsEndpoint)
      }

      regResult = chunk.match(/\[Reconnecting\]\[(wss?:\/\/.+\/)\]\[start\]/)
      if (regResult) {
        const nodeClusterWsEndpoint = regResult.at(1)
        nodeSubprocess.emit(`node_reconnect_start[${nodeClusterWsEndpoint}]`, nodeClusterWsEndpoint)
      }

      regResult = chunk.match(/\[Reconnecting\]\[(wss?:\/\/.+\/)\]\[finish\]/)
      if (regResult) {
        const nodeClusterWsEndpoint = regResult.at(1)
        nodeSubprocess.emit(`node_reconnect_finish[${nodeClusterWsEndpoint}]`, nodeClusterWsEndpoint)
      }
    }
  })()

export const spawnNode = async (cmd, env, tag, notWaitReady) => {
  const nodeSubprocess = spawn(cmd, [], {
    shell: true,
    env: env ? { ...process.env, ...env } : void 0,
    stdio: ["ignore", "pipe", "pipe"],
  })

  const nodeSubprocessReadyPromise = notWaitReady
    ? true
    : new Promise((resolve, reject) => {
        const rejectTimerId = setTimeout(() => reject(new Error("Timeout")), 5_000)

        nodeSubprocess.once("node_ready", (nodeClusterWsEndpoint) => {
          nodeSubprocess.clusterEndpoint = nodeClusterWsEndpoint
          console.log("[Node][Ready]", tag, nodeSubprocess.pid, nodeSubprocess.clusterEndpoint)
          resolve(nodeSubprocess)
          clearTimeout(rejectTimerId)
        })
      })

  nodeSubprocess.stdout.pipe(createPipeStream(tag, nodeSubprocess)).pipe(process.stdout)
  nodeSubprocess.stderr.pipe(createPipeStream(tag, nodeSubprocess)).pipe(process.stderr)

  await nodeSubprocessReadyPromise

  return nodeSubprocess
}

export const startOrAccessNodeA = async (notWaitReady, env) => {
  return nodeA && !nodeA.killed ? nodeA : await spawnNode(RUN_NODE_1_CMD, env, "NODE_A", notWaitReady).then((node) => (nodeA = node))
}

export const startOrAccessNodeB = async (notWaitReady, env) => {
  return nodeB && !nodeB.killed ? nodeB : await spawnNode(RUN_NODE_2_CMD, env, "NODE_B", notWaitReady).then((node) => (nodeB = node))
}

export const createOrganizationId = async (endpoint, name) => {
  const orgName = `Test-${name ?? faker.company.name()}-${faker.string.alphanumeric(8)}`
  const payload = JSON.stringify({ name: orgName })

  const response = await fetch(`${endpoint}/admin/organization`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "admin-api-key": process.env.HTTP_ADMIN_API_KEY },
    body: payload,
  }).then((response) => response.json())

  const organizationId = response.organization._id

  return organizationId
}

export const createDummyData = async (endpointWs, endpointHttp) => {
  dummyDataTestConfig.organizationId = await createOrganizationId(endpointHttp)

  const sdkConfig = {
    endpoint: {
      ws: endpointWs,
      http: endpointHttp,
    },
    organization_id: dummyDataTestConfig.organizationId,
    disableAutoReconnect: true,
  }

  const samaSdk = new SAMAClient(sdkConfig)
  samaSdk.deviceId = v4()

  await samaSdk.connect()

  dummyDataTestConfig.users.user1.login = `TestUser-${faker.internet.username()}`
  const user1 = await samaSdk.userCreate({
    login: dummyDataTestConfig.users.user1.login,
    email: faker.internet.email(),
    password: userPassword,
  })
  dummyDataTestConfig.users.user1.nativeId = user1.native_id

  dummyDataTestConfig.users.user2.login = `TestUser-${faker.internet.username()}`
  const user2 = await samaSdk.userCreate({
    login: dummyDataTestConfig.users.user2.login,
    email: faker.internet.email(),
    password: userPassword,
  })
  dummyDataTestConfig.users.user2.nativeId = user2.native_id

  await samaSdk.socketLogin({ user: { login: dummyDataTestConfig.users.user1.login, password: userPassword } })

  const privateConversation = await samaSdk.conversationCreate({
    name: `Private-${faker.music.songName()}`,
    type: "u",
    participants: [user1.native_id, user2.native_id],
  })
  dummyDataTestConfig.conversations.private.nativeId = privateConversation._id

  const groupConversation = await samaSdk.conversationCreate({
    name: `Group-${faker.music.songName()}`,
    type: "g",
    participants: [user1.native_id, user2.native_id],
  })
  dummyDataTestConfig.conversations.group.nativeId = groupConversation._id

  samaSdk.disconnect()

  await setTimeoutPromise(200)
}

export const killNodeA = () => nodeA?.kill()
export const killNodeB = () => nodeB?.kill()
