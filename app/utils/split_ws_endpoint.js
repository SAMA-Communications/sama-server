import { URL } from "node:url"

export const splitWsEndpoint = url => {
  const parsedUrl = new URL(url)

  return [parsedUrl.protocol, parsedUrl.hostname, parsedUrl.port, parsedUrl.pathname]
}
