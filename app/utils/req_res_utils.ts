export function slice(
  obj: Record<string, unknown>,
  keys: string[],
  setEmptyStringToNull?: boolean,
): Record<string, unknown> {
  return Object.keys(obj)
    .filter((key) => {
      return keys.indexOf(key) >= 0
    })
    .reduce<Record<string, unknown>>((acc, key) => {
      let val = obj[key]
      if (setEmptyStringToNull && val === "") {
        val = null
      }
      acc[key] = val
      return acc
    }, {})
}

export function sliceExcept(obj: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  return Object.keys(obj)
    .filter((key) => {
      return keys.indexOf(key) === -1
    })
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = obj[key]
      return acc
    }, {})
}
