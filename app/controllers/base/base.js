export default class BaseController {
  constructor() {}

  validate(data, schema) {
    const validResult = schema.validate(data);

    //add support for multiply errors
    if (validResult.error) {
      console.log(validResult);
      throw new Error(validResult.error.message, {
        cause: validResult.error.cause,
      });
    }
    return this;
  }
}
