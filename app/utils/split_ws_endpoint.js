export const splitWsEndpoint = (url) => {
  const regex = /^(.*?):\/\/(.*?)(?::([0-9]+))?(\/.*?)?$/;
  const [, protocol, ip, port, path] = url.match(regex);
  return [protocol, ip, port, path];
};
