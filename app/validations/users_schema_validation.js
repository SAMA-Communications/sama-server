import Joi from "joi";

export const usersSchemaValidation = {
  create: Joi.object({
    login: Joi.string().max(40).required(),
    password: Joi.string().min(3).max(40).required(),
    deviceId: Joi.number(),
  }),
  edit: {},
  login: Joi.alternatives().try(
    Joi.object({
      login: Joi.string().min(5).required(),
      password: Joi.string().required(),
      deviceId: Joi.string().max(255),
    }),
    Joi.object({
      token: Joi.string().required(),
      deviceId: Joi.string().max(255),
    })
  ),
  logout: Joi.object({}),
  delete: Joi.object({}),
  search: Joi.object({
    login: Joi.string().required(),
    ignore_ids: Joi.array(),
    limit: Joi.number().min(1).max(100),
    updated_at: Joi.string(),
  }),
};
