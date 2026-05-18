import { URL } from "node:url"

import config from "@sama/config/index.js"

export const buildWsEndpoint = (ip: string, port: number | string): string =>
  new URL(`${config.get("ws.options.isSecure") ? "wss" : "ws"}://${ip}:${port}`).toString()
