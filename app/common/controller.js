export default class BaseController {
  constructor() {}

  validate(data, schema) {
    const validResult = schema.validate(data);

    //add support for multiply errors
    if (validResult.error) {
      throw new Error(validResult.error.message, {
        cause: validResult.error.cause,
      });
    }

    return this;
  }
}
