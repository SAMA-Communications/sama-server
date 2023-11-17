import { default as XML } from "@xmpp/xml"

import BaseXMPPController from "./base.js"

class UsersXMPPController extends BaseXMPPController {
  async open(ws, xmlElement) {
    const version = xmlElement.attrs.version
    const from = xmlElement.attrs.to

    const responseElement = XML('open', {
      from,
      version,
      'xml:lang': 'en',
      xmlns: 'urn:ietf:params:xml:ns:xmpp-framing',
      id: '9155d678-fea1-423a-b760-a4fdc65bae17'
    })

    return responseElement
  }
}

export default new UsersXMPPController();
