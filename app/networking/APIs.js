import JsonAPI from '../../APIs/JSON/index.js'

const APIs = {
  JSON: new JsonAPI(),
}

try {
  const { default: XmppApi } = await import('../../APIs/XMPP/index.js')
  APIs['XMPP'] = new XmppApi()
} catch (error) {

}

export default APIs