export default function groupBy(data, filed) {
  const groupObj = {}
  for (const obj of data) {
    if (!groupObj[obj[filed]]) {
      groupObj[obj[filed]] = []
    }
    groupObj[obj[filed]].push(obj)
  }
  return groupObj
}
