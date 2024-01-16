import path from 'node:path'
import fs from 'node:fs'

const SAMA_ALIAS = '@sama'
const SAMA_XMPP_ALIAS = '@sama-xmpp'

const loaderFilePath = new URL(import.meta.url).pathname
const dirPath = path.dirname(loaderFilePath)

const samaCoreDirPath = path.join(dirPath, 'app')
const samaXmppApiDirPath = path.join(dirPath, 'APIs', 'XMPP')
const samaXmppApiIndexPath = path.join(samaXmppApiDirPath, 'index.js')

const samaXmppApiExists = fs.existsSync(samaXmppApiIndexPath)

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(`${SAMA_ALIAS}/`)) {
    const filePath = specifier.replace(`${SAMA_ALIAS}/`, '')

    const fileFullPath = path.join(samaCoreDirPath, filePath)

    return {
      shortCircuit: true,
      url: new URL(`file://${fileFullPath}`).href
    }
  }

  if (specifier.startsWith(`${SAMA_XMPP_ALIAS}/`)) {
    const filePath = specifier.replace(`${SAMA_XMPP_ALIAS}/`, '')

    const fileFullPath = path.join(samaXmppApiDirPath, filePath)

    return {
      shortCircuit: true,
      url: new URL(`file://${fileFullPath}`).href
    }
  }

  return nextResolve(specifier);
}


export async function load(url, context, nextLoad) {
  const { format } = context

  if (url.includes(samaXmppApiIndexPath) && !samaXmppApiExists) {
    return {
      format: format || 'module',
      shortCircuit: true,
      source: 'export default null',
    }
  }

  return nextLoad(url)
}