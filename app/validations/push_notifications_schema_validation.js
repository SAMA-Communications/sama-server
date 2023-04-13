import Joi from "joi";
import { ERROR_STATUES } from "./constants/errors.js";

export const pushNotificationsSchemaValidation = {
  pushSubscriptionCreate: Joi.object({
    platform: Joi.string()
      .allow("web", "ios", "android")
      .required()
      .error(
        new Error(ERROR_STATUES.INCORRECT_PLATFROM_TYPE.message, {
          cause: ERROR_STATUES.INCORRECT_PLATFROM_TYPE,
        })
      ),
    web_endpoint: Joi.string()
      .required()
      .error(
        new Error(ERROR_STATUES.INCORRECT_TOKEN.message, {
          cause: ERROR_STATUES.INCORRECT_TOKEN,
        })
      ),
    web_key_auth: Joi.string()
      .required()
      .error(
        new Error(ERROR_STATUES.INCORRECT_TOKEN.message, {
          cause: ERROR_STATUES.INCORRECT_KEYS,
        })
      ),
    web_key_p256dh: Joi.string()
      .required()
      .error(
        new Error(ERROR_STATUES.INCORRECT_TOKEN.message, {
          cause: ERROR_STATUES.INCORRECT_KEYS,
        })
      ),
    device_udid: Joi.string()
      .required()
      .error(
        new Error(ERROR_STATUES.INCORRECT_DEVICE_ID.message, {
          cause: ERROR_STATUES.INCORRECT_DEVICE_ID,
        })
      ),
  }).required(),
  pushSubscriptionList: Joi.object({}).required(),
  pushSubscriptionDelete: Joi.object({
    id: Joi.string()
      .required()
      .error(
        new Error(ERROR_STATUES.NOTIFICATION_ID_MISSED.message, {
          cause: ERROR_STATUES.NOTIFICATION_ID_MISSED,
        })
      ),
  }).required(),
  pushEventCreate: Joi.object({
    recipients_ids: Joi.array()
      .min(1)
      .required()
      .error(
        new Error(ERROR_STATUES.INCORRECT_RECIPIENTS_IDS.message, {
          cause: ERROR_STATUES.INCORRECT_RECIPIENTS_IDS,
        })
      ),
    message: Joi.any()
      .required()
      .error(
        new Error(ERROR_STATUES.NOTIFICATION_MESSAGE_MISSED.message, {
          cause: ERROR_STATUES.NOTIFICATION_MESSAGE_MISSED,
        })
      ),
  }).required(),
};
