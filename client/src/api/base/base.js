export default class BaseApi {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async perform(url, method, params = null, headers = {}) {
    const defaultHeaders = {};
    if (method === "POST" && params) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    const request = {
      method, // GET, POST, PUT, DELETE
      headers: {
        ...headers,
        ...defaultHeaders
      }
    }
    if (params)  {
      request.body = JSON.stringify(params)
    }

    const response = await fetch(`${this.baseUrl}/${url}`, request);
    return response.json();
  }
}