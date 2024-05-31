import Joi from "joi"
import { ERROR_STATUES } from "@sama/constants/errors.js"

export const statusSchemaValidation = {
  typing: Joi.object({
    id: Joi.string()
      .min(1)
      .required()
      .error(
        new Error(ERROR_STATUES.STATUS_ID_MISSED.message, {
          cause: ERROR_STATUES.STATUS_ID_MISSED,
        })
      ),
    cid: Joi.string()
      .required()
      .error(
        new Error(ERROR_STATUES.CID_REQUIRED.message, {
          cause: ERROR_STATUES.CID_REQUIRED,
        })
      ),
    type: Joi.string()
      .valid("start", "stop")
      .required()
      .error((errors) => {
        return errors.map((error) => {
          switch (error.code) {
            case "any.only":
              return new Error(ERROR_STATUES.INCORRECT_TYPE.message, {
                cause: ERROR_STATUES.INCORRECT_TYPE,
              })
            default:
              return new Error(ERROR_STATUES.STATUS_TYPE_MISSED.message, {
                cause: ERROR_STATUES.STATUS_TYPE_MISSED,
              })
          }
        })
      }),
    t: Joi.number()
      .required()
      .error(
        new Error(ERROR_STATUES.STATUS_T_MISSED.message, {
          cause: ERROR_STATUES.STATUS_T_MISSED,
        })
      ),
  }).required(),
}
