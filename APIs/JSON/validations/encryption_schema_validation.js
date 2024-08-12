import Joi from "joi"
import { ERROR_STATUES } from "@sama/constants/errors.js"

export const encryptionSchemaValidation = {
  device_register: Joi.object({
    identity_key: Joi.string()
      .max(255)
      .required()
      .error(
        new Error(ERROR_STATUES.INCORRECT_IDENTITY_KEY.message, {
          cause: ERROR_STATUES.INCORRECT_IDENTITY_KEY,
        })
      ),
    signed_key: Joi.string()
      .max(255)
      .required()
      .error(
        new Error(ERROR_STATUES.INCORRECT_SIGNED_KEY.message, {
          cause: ERROR_STATUES.INCORRECT_SIGNED_KEY,
        })
      ),
    one_time_pre_keys: Joi.array()
      .items(
        Joi.string()
          .max(255)
          .error(
            new Error(ERROR_STATUES.INCORRECT_ONE_TIME_PRE_KEYS.message, {
              cause: ERROR_STATUES.INCORRECT_ONE_TIME_PRE_KEYS,
            })
          )
      )
      .max(100)
      .required()
      .error(
        new Error(ERROR_STATUES.INCORRECT_ONE_TIME_PRE_KEYS.message, {
          cause: ERROR_STATUES.INCORRECT_ONE_TIME_PRE_KEYS,
        })
      ),
  }),
  device_delete: Joi.object({
    key: Joi.string()
      .max(255)
      .required()
      .error(
        new Error(ERROR_STATUES.INCORRECT_IDENTITY_KEY.message, {
          cause: ERROR_STATUES.INCORRECT_IDENTITY_KEY,
        })
      ),
  }),
}
