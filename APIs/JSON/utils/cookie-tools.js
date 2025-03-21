import cookieTool from "cookie"
import cookieSignature from "cookie-signature"
import cookieParser from "cookie-parser"

export function parserCookies(cookieStr) {
  let secret = process.env.COOKIE_SECRET
  let cookies = cookieTool.parse(cookieStr)
  let signedCookies = void 0

  if (secret) {
    signedCookies = cookieParser.signedCookies(cookies, secret)

    signedCookies = cookieParser.JSONCookies(signedCookies)
  }

  cookies = cookieParser.JSONCookies(cookies)

  return { cookies, signedCookies }
}

export function serializeCookie(name, value, options) {
  value = options?.secure ? `s:${cookieSignature.sign(value, process.env.COOKIE_SECRET)}` : value

  return cookieTool.serialize(name, value, options)
}
