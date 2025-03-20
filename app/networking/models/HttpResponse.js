class HttpResponse {
  status = 200
  headers = {}
  body = {}

  constructor(status = 200, headers = {}, body = {}) {
    this.status = status ?? this.status
    this.headers = headers ?? this.headers
    this.body = body ?? this.body
  }

  stringifyBody() {
    return JSON.stringify(this.body)
  }
}

export default HttpResponse
