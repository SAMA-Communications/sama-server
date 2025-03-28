class Helpers {
  getDisplayName(user) {
    return user.first_name || user.last_name ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : user.login
  }

  currentTimeStamp() {
    const currentTs = Math.ceil(new Date() / 1000)
    return currentTs
  }

  isEqualsNativeIds(nativeIdA, nativeIdB) {
    return nativeIdA.toString() === nativeIdB.toString()
  }

  extractAccessTokenFromAuthHeader(authHeader) {
    const token = authHeader?.split(" ")?.at(1)
    return token
  }
}

export default Helpers
