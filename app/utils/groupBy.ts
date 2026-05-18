export default function groupBy<T extends Record<string, unknown>>(data: T[], filed: string): Record<string, T[]> {
  const groupObj: Record<string, T[]> = {}
  for (const obj of data) {
    const key = obj[filed] as string
    if (!groupObj[key]) {
      groupObj[key] = []
    }
    groupObj[key].push(obj)
  }
  return groupObj
}
