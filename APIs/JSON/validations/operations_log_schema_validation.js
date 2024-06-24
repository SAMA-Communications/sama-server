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
        new Error(ERROR_STATUES.LOG_TIMETAMP_MISSED.message, {
          cause: ERROR_STATUES.LOG_TIMETAMP_MISSED,
        })
      ),
  }).required(),
}
