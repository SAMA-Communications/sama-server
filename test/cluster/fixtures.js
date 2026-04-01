import killPort from "kill-port"
import { killNodeA, killNodeB } from "./utils.js"

const killPortWrap = (port, method) => killPort(port, method)
  .then(() => console.log('[Port]', port, 'killed'))
  .catch(error => console.log('[Port]', port, error.message)) 

const killPorts = async () => {
  await killPortWrap(9001)
  await killPortWrap(9002)

  await killPortWrap(8001)
  await killPortWrap(8002)
}

export async function mochaGlobalSetup() {
  console.log("[Global][Start]")
  
  await killPorts()
}

export async function mochaGlobalTeardown() {
  console.log("[Global][Shutdown]")

  killNodeA()
  killNodeB()

  await killPorts()
}