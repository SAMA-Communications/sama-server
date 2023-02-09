export default function getIpFromWsUrl(wsUrl) {
  if (!wsUrl) {
    return null;
  }
  return wsUrl.split(":")[1].slice(2);
}
