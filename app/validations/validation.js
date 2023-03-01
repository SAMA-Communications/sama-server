export default class Validation {
  constructor() {}

  validate(data, schema) {
    console.log(schema.validate(data));
    return this;
  }
}
