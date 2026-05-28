export default function groupBy<TItem extends Record<string, unknown>, TGroupFiled>(data: TItem[], filed: string): Map<TGroupFiled, TItem[]> {
  const groupResult = new Map<TGroupFiled, TItem[]>()

  for (const item of data) {
    const groupKey = item[filed] as TGroupFiled
    
    if (!groupResult.has(groupKey)) {
      groupResult.set(groupKey, [])
    }

    groupResult.get(groupKey).push(item)
  }

  return groupResult
}
