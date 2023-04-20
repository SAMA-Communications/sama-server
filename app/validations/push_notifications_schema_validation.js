import Joi from "joi";
import { ERROR_STATUES } from "./constants/errors.js";

export const pushNotificationsSchemaValidation = {
  pushSubscriptionCreate: Joi.object({
    platform: Joi.string()
      .valid("web", "ios", "android")
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
  pushSubscriptionList: Joi.object({
    user_id: Joi.string()
      .required()
      .error(
        new Error(ERROR_STATUES.USER_ID_MISSED.message, {
          cause: ERROR_STATUES.USER_ID_MISSED,
        })
      ),
  }).required(),
  pushSubscriptionDelete: Joi.object({
    device_udid: Joi.string()
      .required()
      .error(
        new Error(ERROR_STATUES.DEVICE_ID_MISSED.message, {
          cause: ERROR_STATUES.DEVICE_ID_MISSED,
        })
      ),
  }).required(),
  pushEventCreate: Joi.object({
    recipients_ids: Joi.array()
      .items(Joi.string().required())
      .min(1)
      .required()
      .error(
        new Error(ERROR_STATUES.INCORRECT_RECIPIENTS_IDS.message, {
          cause: ERROR_STATUES.INCORRECT_RECIPIENTS_IDS,
        })
      ),
    //TODO: add more fields for message
    message: Joi.object({
      title: Joi.string(),
      topic: Joi.string(),
      body: Joi.string(),
      message: Joi.string(),
    })
      .required()
      .error(
        new Error(ERROR_STATUES.NOTIFICATION_MESSAGE_MISSED.message, {
          cause: ERROR_STATUES.NOTIFICATION_MESSAGE_MISSED,
        })
      ),
  }).required(),
};
