class HttpResponse {
  status = 200
  headers = {}
  cookies = []
  body = null

  constructor(status = 200, headers = {}, body = null) {
    this.status = status ?? this.status
    this.headers = headers ?? this.headers
    this.body = body
  }

  stringifyBody() {
    return this.body ? JSON.stringify(this.body) : this.body
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
