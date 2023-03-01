export default class Validation {
  constructor(schema) {
    this.schema = schema;
  }

  validate(json, schemaName) {
    const reqFirstParams = Object.keys(json)[0];
    const request =
      reqFirstParams === "request"
        ? json.request[Object.keys(json.request)[0]]
        : json[reqFirstParams];

    const res = this.schema[schemaName].validate(request);
    if (res.error) {
      throw res.error;
    }

    return this;
  }
}
