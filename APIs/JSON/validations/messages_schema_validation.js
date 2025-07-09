import Joi from "joi"
import { ERROR_STATUES, requiredError } from "@sama/constants/errors.js"

export const messagesSchemaValidation = {
  create: Joi.object()
    .keys({
      id: Joi.string()
        .min(1)
        .error(
          new Error(ERROR_STATUES.INCORRECT_MESSAGE_ID.message, {
            cause: ERROR_STATUES.INCORRECT_MESSAGE_ID,
          })
        ),
      cid: Joi.string()
        .required()
        .error(
          new Error(ERROR_STATUES.CID_REQUIRED.message, {
            cause: ERROR_STATUES.CID_REQUIRED,
          })
        ),
      x: Joi.object(),
      body: Joi.string()
        .max(65536)
        .allow("")
        .error(
          new Error(ERROR_STATUES.MESSAGE_BODY_AND_ATTACHMENTS_EMPTY.message, {
            cause: ERROR_STATUES.MESSAGE_BODY_AND_ATTACHMENTS_EMPTY,
          })
        ),
      attachments: Joi.array()
        .items(
          Joi.object({
            file_id: Joi.string(),
            file_name: Joi.string().max(255),
            file_blur_hash: Joi.string().max(255),
            file_content_type: Joi.string().max(255),
            file_size: Joi.number().max(104857601),
            file_width: Joi.number().max(10000),
            file_height: Joi.number().max(10000),
          })
        )
        .min(1)
        .error(
          new Error(ERROR_STATUES.MESSAGE_BODY_AND_ATTACHMENTS_EMPTY.message, {
            cause: ERROR_STATUES.MESSAGE_BODY_AND_ATTACHMENTS_EMPTY,
          })
        ),
      replied_message_id: Joi.string(),
      forwarded_message_id: Joi.string(),
      deleted_for: Joi.array().items(Joi.alternatives().try(Joi.object(), Joi.string(), Joi.number()).required()),
    })
    .or("body", "attachments", "forwarded_message_id"),
  edit: Joi.object({
    id: Joi.alternatives()
      .try(Joi.object(), Joi.string())
      .error(
        new Error(ERROR_STATUES.INCORRECT_MESSAGE_ID.message, {
          cause: ERROR_STATUES.INCORRECT_MESSAGE_ID,
        })
      ),
    body: Joi.string()
      .max(65536)
      .required()
      .error(
        new Error(ERROR_STATUES.MESSAGE_BODY_AND_ATTACHMENTS_EMPTY.message, {
          cause: ERROR_STATUES.MESSAGE_BODY_AND_ATTACHMENTS_EMPTY,
        })
      ),
  }).required(),
  reactions_update: Joi.object({
    mid: Joi.alternatives()
      .required()
      .try(Joi.object(), Joi.string())
      .error(
        new Error(ERROR_STATUES.INCORRECT_MESSAGE_ID.message, {
          cause: ERROR_STATUES.INCORRECT_MESSAGE_ID,
        })
      ),
    add: Joi.string().max(10).optional(),
    remove: Joi.string().max(10).optional(),
  }).or("add", "remove"),
  list: Joi.object({
    cid: Joi.string()
      .required()
      .error(
        new Error(ERROR_STATUES.CID_REQUIRED.message, {
          cause: ERROR_STATUES.CID_REQUIRED,
        })
      ),
    ids: Joi.array().items(Joi.string()).max(100),
    limit: Joi.number(),
    updated_at: Joi.object().allow({ gt: Joi.date() }, { lt: Joi.date() }),
  }).required(),
  reactions_list: Joi.object({
    mid: Joi.alternatives()
      .required()
      .try(Joi.object(), Joi.string())
      .error(
        new Error(ERROR_STATUES.INCORRECT_MESSAGE_ID.message, {
          cause: ERROR_STATUES.INCORRECT_MESSAGE_ID,
        })
      ),
  }),
  read: Joi.object({
    cid: Joi.string()
      .required()
      .error(
        new Error(ERROR_STATUES.CID_REQUIRED.message, {
          cause: ERROR_STATUES.CID_REQUIRED,
        })
      ),
    ids: Joi.array().items(Joi.alternatives().try(Joi.object(), Joi.string())),
  }).required(),
  delete: Joi.object({
    cid: Joi.string()
      .required()
      .error(
        new Error(ERROR_STATUES.CID_REQUIRED.message, {
          cause: ERROR_STATUES.CID_REQUIRED,
        })
      ),
    type: Joi.string()
      .valid("all", "myself")
      .required()
      .error((errors) => {
        return errors.map((error) => {
          switch (error.code) {
            case "any.only":
              return new Error(ERROR_STATUES.INCORRECT_TYPE.message, {
                cause: ERROR_STATUES.INCORRECT_TYPE,
              })
            default:
              return new Error(ERROR_STATUES.MESSAGE_TYPE_MISSED.message, {
                cause: ERROR_STATUES.MESSAGE_TYPE_MISSED,
              })
          }
        })
      }),
    ids: Joi.array()
      .items(Joi.alternatives().try(Joi.object(), Joi.string()).required())
      .min(1)
      .required()
      .error(
        new Error(ERROR_STATUES.MESSAGE_ID_MISSED.message, {
          cause: ERROR_STATUES.MESSAGE_ID_MISSED,
        })
      ),
    deleted_for: Joi.array().items(Joi.alternatives().try(Joi.object(), Joi.string(), Joi.number()).required()),
  }).required(),
  system: Joi.object({
    id: Joi.string()
      .min(1)
      .required()
      .error(
        new Error(ERROR_STATUES.INCORRECT_MESSAGE_ID.message, {
          cause: ERROR_STATUES.INCORRECT_MESSAGE_ID,
        })
      ),
    cid: Joi.string(),
    uids: Joi.array()
      .items(Joi.alternatives().try(Joi.object(), Joi.string(), Joi.number()).required())
      .max(20),
    x: Joi.object({}).unknown().required().error(requiredError(`'x'`)),
  })
    .or("cid", "uids")
    .error((errors) => {
      return errors.map((error) => {
        if (error instanceof Error) {
          return error
        }

        if (error.local.limit) {
          const text = `'${error.local.key}' max length ${error.local.limit}`
          return new Error(text, { cause: { status: 422, message: text } })
        }

        if (error.local.peers?.toString() === "cid,uids") {
          return requiredError(`'cid' or 'uids'`)
        }

        return error
      })
    })
    .oxor("cid", "uids")
    .required(),
}
