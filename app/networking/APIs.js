import JsonAPI from '../../APIs/JSON/index.js'

const BASE_API = 'JSON'

const APIs = {
  [BASE_API]: new JsonAPI(),
}

try {
  const { default: XmppApi } = await import('../../APIs/XMPP/index.js')
  APIs['XMPP'] = new XmppApi()
} catch (error) {
  console.log('[XMPP][package load][error]', error)
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