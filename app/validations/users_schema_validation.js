import Joi from "joi";
import { ERROR_STATUES } from "./../constants/http_constants.js";

export const usersSchemaValidation = {
  create: Joi.object({
    login: Joi.string()
      .max(40)
      .required()
      .error(
        new Error(ERROR_STATUES.INCORRECT_LOGIN.message, {
          cause: ERROR_STATUES.INCORRECT_LOGIN,
        })
      ),
    // .pattern(/^[a-z0-9._%+-]$/),
    password: Joi.string()
      .min(3)
      .max(40)
      .required()
      .error(
        new Error(ERROR_STATUES.INCORRECT_PASSWORD.message, {
          cause: ERROR_STATUES.INCORRECT_PASSWORD,
        })
      ),
    // .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,40}$/),
    deviceId: Joi.alternatives().try(
      Joi.number().max(255).required(),
      Joi.string().max(255).required()
    ),
  }),
  edit: Joi.object({
    login: Joi.string()
      .max(40)
      .required()
      .error(
        new Error(ERROR_STATUES.INCORRECT_USER.message, {
          cause: ERROR_STATUES.INCORRECT_USER,
        })
      ),
    current_password: Joi.string()
      .required()
      .error(
        new Error(ERROR_STATUES.INCORRECT_CURRENT_PASSWORD.message, {
          cause: ERROR_STATUES.INCORRECT_CURRENT_PASSWORD,
        })
      ),
    new_password: Joi.string().min(3).max(40).required(),
    // .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,40}$/),
  }),
  login: Joi.object()
    .keys({
      login: Joi.string().error(
        new Error(ERROR_STATUES.USER_LOGIN_OR_PASS.message, {
          cause: ERROR_STATUES.USER_LOGIN_OR_PASS,
        })
      ),
      token: Joi.string(),
      password: Joi.string(),
      deviceId: Joi.alternatives()
        .try(Joi.number(), Joi.string().max(255))
        .required()
        .error(
          new Error(ERROR_STATUES.DEVICE_ID_MISSED.message, {
            cause: ERROR_STATUES.DEVICE_ID_MISSED,
          })
        ),
    })
    .oxor("token", "login")
    .with("login", "password"),
  logout: Joi.object({}).required(),
  delete: Joi.object({}).required(),
  search: Joi.object({
    login: Joi.string().required(),
    limit: Joi.number().min(1).max(100),
    updated_at: Joi.object({
      gt: Joi.date(),
    }),
    ignore_ids: Joi.array().items(
      Joi.alternatives().try(Joi.object(), Joi.string())
    ),
  }).required(),
};
