import Joi from "joi";
import { ERROR_STATUES } from "./constants/errors.js";

export const activitiesSchemaValidation = {
  status_subscribe: Joi.object({
    id: Joi.alternatives()
      .try(Joi.object(), Joi.string())
      .required()
      .error(
        new Error(ERROR_STATUES.USER_ID_MISSED.message, {
          cause: ERROR_STATUES.USER_ID_MISSED,
        })
      ),
  }).required(),
  statusUnsubscribe: Joi.object({}).required(),
  get_user_status: Joi.object({
    ids: Joi.array()
      .items(Joi.alternatives().try(Joi.object(), Joi.string()).required())
      .required(),
  }).required(),
};
