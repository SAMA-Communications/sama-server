import config from "@sama/config/index.js"

export const buildWsEndpoint = (ip, port) => `${config.get("ws.options.isSecure") ? "wss" : "ws"}://${ip}:${port}`
