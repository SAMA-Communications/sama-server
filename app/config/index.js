import os from "node:os"
import ip from "ip"

import CONFIG_VALUES from "./default.js"
import Config from "./config.js"

const config = new Config(CONFIG_VALUES)

config.set("app.hostName", os.hostname(), true)
config.set("app.ip", ip.address())

const isSecureWs = config.get("ws.options.ssl.key") && config.get("ws.options.ssl.cert")
config.set("ws.options.isSecure", !!isSecureWs)

const isTls = config.get("tcp.options.tls.key") && config.get("tcp.options.tls.cert")
config.set("tcp.options.isTls", !!isTls)

export default config
