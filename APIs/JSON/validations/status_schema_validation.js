import Joi from "joi"
import { ERROR_STATUES } from "@sama/constants/errors.js"

export const statusSchemaValidation = {
  typing: Joi.object({
    cid: Joi.string()
      .required()
      .error(
        new Error(ERROR_STATUES.CID_REQUIRED.message, {
          cause: ERROR_STATUES.CID_REQUIRED,
        })
      ),
  }).required(),
}
