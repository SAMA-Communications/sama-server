export default class BaseController {
  constructor() {}

  validate(data, schema) {
    console.log(schema.validate(data));
    return this;
  }
}
