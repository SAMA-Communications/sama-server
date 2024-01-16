export const detectJsonMessage = (message) => {
  try {
    JSON.parse(message)
    return true
  } catch (error) {
    return false
  }
}