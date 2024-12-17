import Joi from "joi"
import { ERROR_STATUES } from "@sama/constants/errors.js"

export const usersSchemaValidation = {
  create: Joi.object({
    login: Joi.string()
      .min(3)
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
    email: Joi.string(),
    // .pattern(/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/),
    phone: Joi.string().min(3).max(15),
    device_id: Joi.alternatives().try(Joi.number().max(255).required(), Joi.string().max(255).required()),
  }),
  edit: Joi.object({
    current_password: Joi.string().error(
      new Error(ERROR_STATUES.INCORRECT_CURRENT_PASSWORD.message, {
        cause: ERROR_STATUES.INCORRECT_CURRENT_PASSWORD,
      })
    ),
    new_password: Joi.string().min(3).max(40),
    // .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,40}$/),
    email: Joi.string().pattern(/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/),
    phone: Joi.string().min(3).max(15),
    login: Joi.string().min(3).max(40),
    first_name: Joi.string().min(1).max(20),
    last_name: Joi.string().min(1).max(20),
    avatar_object: Joi.object({
      file_id: Joi.string(),
      file_name: Joi.string().max(255),
      file_blur_hash: Joi.string().max(255),
    }),
  }).with("current_password", "current_password"),
  connect: Joi.object({
    token: Joi.string(),
    device_id: Joi.alternatives()
      .try(Joi.number(), Joi.string().max(255))
      .required()
      .error(
        new Error(ERROR_STATUES.DEVICE_ID_MISSED.message, {
          cause: ERROR_STATUES.DEVICE_ID_MISSED,
        })
      ),
  }),
  login: Joi.object({
    login: Joi.string().error(
      new Error(ERROR_STATUES.USER_LOGIN_OR_PASS.message, {
        cause: ERROR_STATUES.USER_LOGIN_OR_PASS,
      })
    ),
    token: Joi.string(),
    password: Joi.string(),
    device_id: Joi.alternatives()
      .try(Joi.number(), Joi.string().max(255))
      .required()
      .error(
        new Error(ERROR_STATUES.DEVICE_ID_MISSED.message, {
          cause: ERROR_STATUES.DEVICE_ID_MISSED,
        })
      ),
  })
    .oxor("token", "login")
    .with("login", "password")
    .unknown(),
  logout: Joi.object({}).required(),
  delete: Joi.object({}).required(),
  search: Joi.object({
    login: Joi.string().required(),
    limit: Joi.number().min(1).max(100),
    updated_at: Joi.object({
      gt: Joi.date(),
    }),
    ignore_ids: Joi.array().items(Joi.alternatives().try(Joi.object(), Joi.string(), Joi.number())),
  }).required(),
  list: Joi.object({
    ids: Joi.array()
      .items(Joi.alternatives().try(Joi.object(), Joi.string(), Joi.number()))
      .min(1)
      .max(100),
  }).required(),
}
