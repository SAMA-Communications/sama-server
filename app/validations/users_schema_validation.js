import Joi from "joi";

export const usersSchemaValidation = {
  create: Joi.object({
    login: Joi.string().min(5).max(30).required(),
    password: Joi.string().required(),
    deviceId: Joi.number(),
  }),
  login: Joi.object({
    login: Joi.string().min(5).max(30).required(),
    password: Joi.string().required(),
    deviceId: Joi.number(),
  }),
};
