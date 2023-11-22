import path from 'node:path'

const SAMA_ALIAS = '@sama'

const loaderFilePath = new URL(import.meta.url).pathname
const dirPath = path.dirname(loaderFilePath)
const samaCoreDirPath = path.join(dirPath, 'app')

export async function resolve(specifier, context, nextResolve) {

  if (specifier.startsWith(SAMA_ALIAS)) {
    const filePath = specifier.replace(`${SAMA_ALIAS}/`, '')

    const fileFullPath = path.join(samaCoreDirPath, filePath)

    return {
      shortCircuit: true,
      url: new URL(`file://${fileFullPath}`).href
    }
  }

  return nextResolve(specifier);
} 