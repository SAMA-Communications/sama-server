export const buildWsEndpoint = (ip, port) =>
  `${isSecureWs() ? 'wss' : 'ws'}://${ip}:${port}`

export const isSecureWs = () =>
  !!(process.env.SSL_KEY_FILE_NAME && process.env.SSL_CERT_FILE_NAME)
