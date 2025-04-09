import Joi from "joi"
import { ERROR_STATUES } from "@sama/constants/errors.js"

export const operationsLogSchemaValidation = {
  logs: Joi.object({
    created_at: Joi.object({
      gt: Joi.date(),
      lt: Joi.date(),
    })
      .oxor("gt", "lt")
      .error(
        new Error(ERROR_STATUES.LOG_TIMESTAMP_MISSED.message, {
          cause: ERROR_STATUES.LOG_TIMESTAMP_MISSED,
        })
      ),
  }).required(),
}
