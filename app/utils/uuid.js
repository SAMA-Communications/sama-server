export default function getUniqueId(suffix) {
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
