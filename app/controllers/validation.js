import Joi from "joi";

class ValidateJson {
  constructor() {
    this.schemes = {
      user_create: Joi.object({
        login: Joi.string().min(10).max(30).required(),
        password: Joi.string().required(),
        deviceId: Joi.number(),
      }),
      user_login: Joi.object({
        login: Joi.string().min(10).max(30).required(),
        password: Joi.string().required(),
        deviceId: Joi.number(),
      }),
    };
  }
  async validate(schemeName, type, json) {
    const data = type ? json[type] : json;
    const requestId = type ? json[type].id : json.id;

    try {
      //TODO: add new schemes to remove this `if`
      if (!this.schemes[schemeName]) {
        return { response: { id: requestId, success: true } };
      }

      await this.schemes[schemeName].validateAsync(data[schemeName]);
      return { response: { id: requestId, success: true } };
    } catch (e) {
      //TODO: multiple errors support for return
      return { response: { id: requestId, error: e.details[0] } };
    }
  }
}

const ValidationController = new ValidateJson();

export default ValidationController;
