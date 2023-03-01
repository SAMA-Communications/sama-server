import Joi from "joi";

export default class Validation {
  constructor() {
    this.shem;
  }

  validate() {
    const shema = Joi.object({
      login: Joi.string().min(10).max(30).required(),
      password: Joi.string().required(),
      deviceId: Joi.number(),
    });
    const res = shema.validate({
      login: "123",
      password: "123",
      deviceId: 123412,
    });
    console.log("result:", res);
    console.log("Validate working!");
    return this;
  }
}
