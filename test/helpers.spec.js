import assert from "node:assert"

import "./tools/utils.js"

import { parserCookies, serializeCookie } from "../APIs/JSON/utils/cookie-tools.js"
import ServiceLocatorContainer from "../app/common/ServiceLocatorContainer.js"

const helpers = ServiceLocatorContainer.use("Helpers")

describe(`Helpers`, () => {
  before(() => {})

  describe("Tools", () => {
    it("extract auth token from header", () => {
      const authToken = `${Math.random()}_random_token`
      const authHeader = `Bear ${authToken}`

      const extractedAuthToken = helpers.extractAccessTokenFromAuthHeader(authHeader)

      assert.equal(extractedAuthToken, authToken)
    })
  })

  describe("Cookies", () => {
    const simpleCookieName = "secret-name"
    const secretCookieName = "name-test"

    const simpleValue = "value1"
    const secretValue = "secret1"

    let simpleCookie = null
    let secretCookie = null

    it("serialize simple cookie", () => {
      const serializedCookie = serializeCookie(simpleCookieName, simpleValue)

      assert.ok(serializedCookie)

      simpleCookie = serializedCookie
    })

    it("serialize secret cookie", () => {
      const serializedCookie = serializeCookie(secretCookieName, secretValue, { secure: true, httpOnly: true })

      assert.ok(serializedCookie)

      secretCookie = serializedCookie
    })

    it("parseCookie", () => {
      const cookieStr = [simpleCookie, secretCookie].join("; ")
      const parsedCookies = parserCookies(cookieStr)

      assert.equal(parsedCookies.cookies[simpleCookieName], simpleValue)
      assert.equal(parsedCookies.signedCookies[secretCookieName], secretValue)
    })
  })

  after(() => {})
})
