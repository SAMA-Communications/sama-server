export const detectXMPPMessage = (message) => {
  return message.startsWith('<') && message.endsWith('>')
}