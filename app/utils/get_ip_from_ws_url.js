import { URL } from "node:url"

export const getIpFromWsUrl = wsUrl => new URL(wsUrl).hostname
