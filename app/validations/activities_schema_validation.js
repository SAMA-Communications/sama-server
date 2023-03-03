import Joi from "joi";
import { ERROR_STATUES } from "./../constants/http_constants.js";

export const activitiesSchemaValidation = {
  statusSubscribe: Joi.object({
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
  getUserStatus: Joi.object({
    ids: Joi.array()
      .items(Joi.alternatives().try(Joi.object(), Joi.string()).required())
      .required(),
  }).required(),
};
