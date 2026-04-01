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

const createTransformStream = (tag, nodeSubprocess) => new (class extends Transform {
  _transform(chunk, encoding, cb) {
    const withPrefixChunk = `|-${tag}-|${chunk}`
    cb(void 0, withPrefixChunk)

    if (chunk.includes('[TCP] listening on port')) {
      nodeSubprocess.emit('node_ready', nodeSubprocess)
    }
  }
})

export const spawnNode = async (cmd, tag, createPipeStream = createTransformStream) => {
  const nodeSubprocess = spawn(cmd, [], {
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe']
  })
  
  const nodeSubprocessReadyPromise = new Promise((resolve, reject) => {
    const rejectTimerId = setTimeout(() => reject(new Error('Timeout')), 5_000)
  
    nodeSubprocess.once('node_ready', (nodeSubprocess) => {
      console.log('[Node][Ready]', tag, nodeSubprocess.pid)
      resolve(nodeSubprocess)
      clearTimeout(rejectTimerId)
    })
  })

  nodeSubprocess.stdout.pipe(createPipeStream(tag, nodeSubprocess)).pipe(process.stdout)
  nodeSubprocess.stderr.pipe(createPipeStream(tag, nodeSubprocess)).pipe(process.stderr)

  await nodeSubprocessReadyPromise

  return nodeSubprocess
}

export const startOrAccessNodeA = async (tag = 'NODE_A', createPipeStream) => {
  return nodeA ? nodeA : await spawnNode(RUN_NODE_1_CMD, tag, createPipeStream).then(node => nodeA = node)
}

export const startOrAccessNodeB = async (tag = 'NODE_B', createPipeStream) => {
  return nodeB ? nodeB : await spawnNode(RUN_NODE_2_CMD, tag, createPipeStream).then(node => nodeB = node)
}
