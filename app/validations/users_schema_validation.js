import Joi from "joi";

export const usersSchemaValidation = {
  create: Joi.object({
    login: Joi.string().min(5).required(),
    password: Joi.string().required(),
    deviceId: Joi.number(),
  }),
  edit: {},
  login: Joi.alternatives().try(
    Joi.object({
      login: Joi.string().min(5).required(),
      password: Joi.string().required(),
      deviceId: Joi.number(),
    }),
    Joi.object({
      token: Joi.string().required(),
      deviceId: Joi.number(),
    })
  ),
  logout: Joi.object({}),
  delete: Joi.object({}),
  search: Joi.object({
    login: Joi.string().required(),
    ignore_ids: Joi.array(),
    limit: Joi.number(),
    updated_at: Joi.string(),
  }),
};
