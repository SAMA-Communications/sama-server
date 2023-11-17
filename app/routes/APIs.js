import JsonAPI from '../../APIs/JSON/index.js'
import XmppAPI from '../../APIs/XMPP/index.js'

const APIs = {
  JSON: new JsonAPI(),
  XMPP: new XmppAPI()
}

export default APIs