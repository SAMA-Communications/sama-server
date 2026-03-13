import { CONSTANTS as MAIN_CONSTANTS } from "../../../constants/constants.js"
import { buildWsEndpoint } from "../../../utils/build_ws_endpoint.js"

class ClusterNodeService {
  constructor(config, redisClient) {
    this.config = config
    this.redisClient = redisClient
  }

  #nodeInfoKey(endpoint) {
    return `${MAIN_CONSTANTS.REDIS_PREFIXES.NODE_DATA}:${endpoint}`
  }

  async retrieveActive() {
    const nodeKeys = await this.redisClient.findKeysByPattern(this.#nodeInfoKey("*"))

    const nodesInfo = []

    for (const nodeKey of nodeKeys) {
      const nodeInfo = await this.redisClient.client.hGetAll(nodeKey)
      nodesInfo.push(nodeInfo)
    }

    const nodeEndpoints = nodesInfo.map((node) => buildWsEndpoint(node.ip_address, node.port))

    const activeNodeEndpoints = new Set(nodeEndpoints)

    return activeNodeEndpoints
  }

  async retrieveStored() {
    const nodeKeys = await this.redisClient.findKeysByPattern(`${MAIN_CONSTANTS.REDIS_PREFIXES.NODE_USERS}:*`)

    const nodeEndpoints = nodeKeys.map((nodeKey) => nodeKey.replace(`${MAIN_CONSTANTS.REDIS_PREFIXES.NODE_USERS}:`, ""))

    return new Set(nodeEndpoints)
  }

  async upsert(addressParams, optionalParams) {
    const currentNodeKey = this.#nodeInfoKey(this.config.get("ws.cluster.endpoint"))

    const keyValuePairs = Object.entries(Object.assign({}, addressParams, optionalParams))
      .flat()
      .map((val) => `${val}`)

    await this.redisClient.client.hSet(currentNodeKey, keyValuePairs)

    const expireSeconds = Math.round(this.config.get("ws.cluster.nodeExpiresIn") / 1_000) + 5
    await this.redisClient.client.expire(currentNodeKey, expireSeconds)
  }
}

export default ClusterNodeService
