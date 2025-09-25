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

  getUniqueId(suffix) {
    const uuid = "xxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0,
        v = c == "x" ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
    if (typeof suffix == "string" || typeof suffix == "number") {
      return uuid + suffix
    } else {
      return uuid + ""
    }
  }
}

export default Helpers
