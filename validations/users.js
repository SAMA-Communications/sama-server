import Joi from "joi";

const userSchema = Joi.object({
  login: Joi.string().min(10).max(30).required(),
  password: Joi.string().required(),
  deviceId: Joi.number(),
});

export { userSchema };
