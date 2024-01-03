import Joi from "joi";
import { ERROR_STATUES } from "./constants/errors.js";

export const usersBlockSchemaValidation = {
  block: Joi.object({
    id: Joi.alternatives().try(Joi.object(), Joi.string()).required(),
  })
    .required()
    .error(
      new Error(ERROR_STATUES.USER_ID_MISSED.message, {
        cause: ERROR_STATUES.USER_ID_MISSED,
      })
    ),
  unblock: Joi.object({
    id: Joi.alternatives().try(Joi.object(), Joi.string()).required(),
  })
    .required()
    .error(
      new Error(ERROR_STATUES.USER_ID_MISSED.message, {
        cause: ERROR_STATUES.USER_ID_MISSED,
      })
    ),
  list: Joi.object({}).required(),
};