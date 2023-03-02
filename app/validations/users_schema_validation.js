import Joi from "joi";

export const usersSchemaValidation = {
  create: Joi.object({
    login: Joi.string()
      .max(40)
      .required()
      .pattern(/^[a-z0-9._%+-]$/),
    password: Joi.string().min(3).max(40).required(),
    // .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,40}$/),
    deviceId: Joi.number(),
  }),
  edit: Joi.object({
    login: Joi.string().max(40).required(),
    current_password: Joi.string().required(),
    new_password: Joi.string().min(3).max(40).required(),
    // .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,40}$/),
  }),
  login: Joi.alternatives().try(
    Joi.object({
      login: Joi.string().min(5).required(),
      password: Joi.string().required(),
      deviceId: Joi.string().max(255),
    }).required(),
    Joi.object({
      token: Joi.string().required(),
      deviceId: Joi.string().max(255),
    }).required()
  ),
  logout: Joi.object({}).required(),
  delete: Joi.object({}).required(),
  search: Joi.object({
    login: Joi.string().required(),
    limit: Joi.number().min(1).max(100),
    updated_at: Joi.object({
      gt: Joi.date(),
    }),
    ignore_ids: Joi.array().items(Joi.string().required()),
  }).required(),
};
