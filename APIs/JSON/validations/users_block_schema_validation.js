import Joi from "joi"
import { ERROR_STATUES } from "@sama/constants/errors.js"

export const usersBlockSchemaValidation = {
  block: Joi.object({
    ids: Joi.array()
      .items(Joi.alternatives().try(Joi.object(), Joi.string().min(24), Joi.number()))
      .required(),
  })
    .required()
    .error(
      new Error(ERROR_STATUES.INVALID_DATA_FORMAT.message, {
        cause: ERROR_STATUES.INVALID_DATA_FORMAT,
      })
    ),
  unblock: Joi.object({
    ids: Joi.array()
      .items(Joi.alternatives().try(Joi.object(), Joi.string().min(24), Joi.number()))
      .required(),
  })
    .required()
    .error(
      new Error(ERROR_STATUES.INVALID_DATA_FORMAT.message, {
        cause: ERROR_STATUES.INVALID_DATA_FORMAT,
      })
    ),
  list: Joi.object({}).required(),
  enable: Joi.object({
    enable: Joi.bool(),
  }),
}
