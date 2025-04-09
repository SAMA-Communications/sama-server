import Joi from "joi"
import { ERROR_STATUES } from "@sama/constants/errors.js"

export const pushNotificationsSchemaValidation = {
  push_subscription_create: Joi.object({
    platform: Joi.string().valid("web", "ios", "android").required(),
    web_endpoint: Joi.string(),
    web_key_auth: Joi.string(),
    web_key_p256dh: Joi.string(),
    device_udid: Joi.string().required(),
    device_token: Joi.string(),
  })
    .xor("web_endpoint", "device_token")
    .when(Joi.object({ web_endpoint: Joi.exist() }).unknown(), {
      then: Joi.object({
        web_key_auth: Joi.string().required(),
        web_key_p256dh: Joi.string().required(),
      }),
    })
    .error((errors) => {
      return errors.map((error) => {
        switch (error.code) {
          case "object.missing":
            return new Error(ERROR_STATUES.FILE_LIMIT_EXCEEDED.message, {
              cause: ERROR_STATUES.INCORRECT_TOKEN,
            })
          default:
            switch (error.local.key) {
              case "platform":
                return new Error(ERROR_STATUES.INCORRECT_PLATFORM_TYPE.message, {
                  cause: ERROR_STATUES.INCORRECT_PLATFORM_TYPE,
                })
              case "web_endpoint":
                return new Error(ERROR_STATUES.INCORRECT_TOKEN.message, {
                  cause: ERROR_STATUES.INCORRECT_TOKEN,
                })
              case "web_key_auth":
                return new Error(ERROR_STATUES.INCORRECT_TOKEN.message, {
                  cause: ERROR_STATUES.INCORRECT_KEYS,
                })
              case "web_key_p256dh":
                return new Error(ERROR_STATUES.INCORRECT_TOKEN.message, {
                  cause: ERROR_STATUES.INCORRECT_KEYS,
                })
              case "device_udid":
                return new Error(ERROR_STATUES.INCORRECT_DEVICE_ID.message, {
                  cause: ERROR_STATUES.INCORRECT_DEVICE_ID,
                })
              case "device_token":
                return new Error(ERROR_STATUES.INCORRECT_TOKEN.message, {
                  cause: ERROR_STATUES.INCORRECT_TOKEN,
                })
            }
        }
      })
    }),
  push_subscription_list: Joi.object({
    user_id: Joi.alternatives()
      .try(Joi.object(), Joi.string(), Joi.number())
      .required()
      .error(
        new Error(ERROR_STATUES.USER_ID_MISSED.message, {
          cause: ERROR_STATUES.USER_ID_MISSED,
        })
      ),
  }).required(),
  push_subscription_delete: Joi.object({
    device_udid: Joi.string()
      .required()
      .error(
        new Error(ERROR_STATUES.DEVICE_ID_MISSED.message, {
          cause: ERROR_STATUES.DEVICE_ID_MISSED,
        })
      ),
  }).required(),
  push_event_create: Joi.object({
    recipients_ids: Joi.array()
      .items(Joi.alternatives().try(Joi.object(), Joi.string(), Joi.number()))
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
}
