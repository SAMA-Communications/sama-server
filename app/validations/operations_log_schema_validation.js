import Joi from "joi";
import { ERROR_STATUES } from "./../constants/http_constants.js";

export const operationsLogSchemaValidation = {
  logs: Joi.object({
    created_at: Joi.object({
      gt: Joi.number(),
      lt: Joi.number(),
    })
      .oxor("gt", "lt")
      .error(
        new Error(ERROR_STATUES.LOG_TIMETAMP_MISSED.message, {
          cause: ERROR_STATUES.LOG_TIMETAMP_MISSED,
        })
      ),
  }).required(),
};
