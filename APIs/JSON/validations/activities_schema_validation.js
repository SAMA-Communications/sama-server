import Joi from "joi"
import { ERROR_STATUES } from "@sama/constants/errors.js"

export const activitiesSchemaValidation = {
  status_subscribe: Joi.object({
    id: Joi.alternatives()
      .try(Joi.object(), Joi.string(), Joi.number())
      .required()
      .error(
        new Error(ERROR_STATUES.USER_ID_MISSED.message, {
          cause: ERROR_STATUES.USER_ID_MISSED,
        })
      ),
  }).required(),
  status_unsubscribe: Joi.object({}).required(),
  get_user_status: Joi.object({
    ids: Joi.array()
      .items(Joi.alternatives().try(Joi.object(), Joi.string(), Joi.number()).required())
      .required(),
  }).required(),
  online_list: Joi.object({
    count: Joi.boolean().optional(),
    idsOnly: Joi.boolean().optional(),
    limit: Joi.number().max(100).min(1).optional(),
    offset: Joi.number().min(0).optional(),
  }),
}
