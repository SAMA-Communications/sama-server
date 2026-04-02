import { spawn } from "node:child_process"
import { Transform } from "node:stream"
import process from "node:process"

export const RUN_NODE_1_CMD = process.env.RUN_NODE_1_CMD
export const RUN_NODE_2_CMD = process.env.RUN_NODE_2_CMD

export const NODE_1_WS_ENDPOINT = process.env.NODE_1_WS_ENDPOINT
export const NODE_2_WS_ENDPOINT = process.env.NODE_2_WS_ENDPOINT
export const NODE_1_HTTP_ENDPOINT = process.env.NODE_1_HTTP_ENDPOINT
export const NODE_2_HTTP_ENDPOINT = process.env.NODE_2_HTTP_ENDPOINT

export const TEST_ORG_ID = process.env.TEST_ORG_ID
export const TEST_U_CONV_ID = process.env.TEST_U_CONV_ID
export const TEST_G_CONV_ID = process.env.TEST_G_CONV_ID

export const userANativeId = '69cbe9757fc0a44161188215'
export const userBNativeId = '69cbe9a27fc0a44161188218'

let nodeA = void 0
let nodeB = void 0

console.log(RUN_NODE_1_CMD, RUN_NODE_2_CMD)

// ws endpoint reg: /wss?:\/\/wss?:\/\/.+\//

const createPipeStream = (tag, nodeSubprocess) => new (class extends Transform {
  _transform(chunk, encoding, cb) {
    chunk = chunk.toString()
    const withPrefixChunk = `|-${tag}-|${chunk}`
    cb(void 0, withPrefixChunk)

    let regResult = chunk.match(/\[Ready\] cluster-ws: (wss?:\/\/.+\/)/)
    if (regResult) {
      const nodeClusterWsEndpoint = regResult.at(1)
      nodeSubprocess.emit('node_ready', nodeClusterWsEndpoint)
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
})

export const spawnNode = async (cmd, tag) => {
  const nodeSubprocess = spawn(cmd, [], {
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe']
  })
  
  const nodeSubprocessReadyPromise = new Promise((resolve, reject) => {
    const rejectTimerId = setTimeout(() => reject(new Error('Timeout')), 5_000)
  
    nodeSubprocess.once('node_ready', (nodeClusterWsEndpoint) => {
      nodeSubprocess.clusterEndpoint = nodeClusterWsEndpoint
      console.log('[Node][Ready]', tag, nodeSubprocess.pid, nodeSubprocess.clusterEndpoint)
      resolve(nodeSubprocess)
      clearTimeout(rejectTimerId)
    })
  })

  nodeSubprocess.stdout.pipe(createPipeStream(tag, nodeSubprocess)).pipe(process.stdout)
  nodeSubprocess.stderr.pipe(createPipeStream(tag, nodeSubprocess)).pipe(process.stderr)

  await nodeSubprocessReadyPromise

  return nodeSubprocess
}

export const startOrAccessNodeA = async (tag = 'NODE_A', force) => {
  return (nodeA && !force) ? nodeA : await spawnNode(RUN_NODE_1_CMD, tag).then(node => nodeA = node)
}

export const startOrAccessNodeB = async (tag = 'NODE_B', force) => {
  return (nodeB && !force) ? nodeB : await spawnNode(RUN_NODE_2_CMD, tag).then(node => nodeB = node)
}

export const killNodeA = () => nodeA?.kill()
export const killNodeB = () => nodeB?.kill()
