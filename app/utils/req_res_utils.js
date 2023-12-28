export function slice(obj, keys, setEmptyStringToNull) {
  return Object.keys(obj)
    .filter(key => {
      return keys.indexOf(key) >= 0
    })
    .reduce((acc, key) => {
      let val = obj[key]
      if (setEmptyStringToNull && (val === '')) {
        val = null
      }
      acc[key] = val
      return acc
    }, {})
}

export function sliceExcept(obj, keys) {
  return Object.keys(obj)
    .filter(key => {
      return keys.indexOf(key) === -1
    })
    .reduce((acc, key) => {
      acc[key] = obj[key]
      return acc
    }, {})
}
