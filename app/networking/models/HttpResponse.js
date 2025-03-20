class HttpResponse {
  status = 200
  headers = {}
  body = {}
  cookies = []

  constructor(status = 200, headers = {}, body = {}) {
    this.status = status ?? this.status
    this.headers = headers ?? this.headers
    this.body = body ?? this.body
  }

  stringifyBody() {
    return JSON.stringify(this.body)
  }

  addHeader(name, value) {
    this.headers[name] = value
    return this
  }

  addCookie(name, value, options) {
    this.cookies.push({ name, value, options })
    return this
  }
}

export default HttpResponse
