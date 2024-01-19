import JsonAPI from '../../APIs/JSON/index.js'
import XmppAPI from '@sama-xmpp/index.js'

const BASE_API = 'JSON'

const APIs = {
  [BASE_API]: new JsonAPI(),
}

const useXMPP = process.argv.some(arg => arg === '--xmpp')
if (XmppAPI && useXMPP) {
  APIs['XMPP'] = new XmppAPI()
}

const detectAPIType = (ws, stringMessage) => {
  const apiType = Object.entries(APIs).find(([type, api]) => {
    try {
      return api.detectMessage(ws, stringMessage)
    } catch (error) {
      return false
    }
  })

  return apiType
}

export { BASE_API, APIs, detectAPIType }