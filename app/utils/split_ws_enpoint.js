export const buildWsEndpoint = (ip, port) =>
  `${isSecureWs() ? "wss" : "ws"}://${ip}:${port}`;

export const splitWsEnpoint = (url) => {
  const regex = /^(.*?):\/\/(.*?)(?::([0-9]+))?(\/.*?)?$/;
  const [, protocol, ip, port, path] = url.match(regex);
  return [protocol, ip, port, path];
};

export const isSecureWs = () =>
  !!(process.env.SSL_KEY_FILE_NAME && process.env.SSL_CERT_FILE_NAME);
