import Joi from "joi";
import { ERROR_STATUES } from "./../constants/http_constants.js";

export const messagesSchemaValidation = {
  create: Joi.object()
    .keys({
      id: Joi.string()
        .min(1)
        .required()
        .error(
          new Error(ERROR_STATUES.MESSAGE_ID_MISSED.message, {
            cause: ERROR_STATUES.MESSAGE_ID_MISSED,
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
            file_name: Joi.string().max(40),
          })
        )
        .min(1)
        .error(
          new Error(ERROR_STATUES.MESSAGE_BODY_AND_ATTACHMENTS_EMPTY.message, {
            cause: ERROR_STATUES.MESSAGE_BODY_AND_ATTACHMENTS_EMPTY,
          })
        ),
      deleted_for: Joi.array().items(
        Joi.alternatives().try(Joi.object(), Joi.string()).required()
      ),
    })
    .or("body", "attachments"),
  edit: Joi.object({
    id: Joi.alternatives()
      .try(Joi.object(), Joi.string())
      .required()
      .error(
        new Error(ERROR_STATUES.MESSAGE_ID_MISSED.message, {
          cause: ERROR_STATUES.MESSAGE_ID_MISSED,
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
  list: Joi.object({
    cid: Joi.string()
      .required()
      .error(
        new Error(ERROR_STATUES.CID_REQUIRED.message, {
          cause: ERROR_STATUES.CID_REQUIRED,
        })
      ),
    limit: Joi.number(),
    updated_at: Joi.object({ gt: Joi.number() }),
  }).required(),
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
              });
            default:
              return new Error(ERROR_STATUES.MESSAGE_TYPE_MISSED.message, {
                cause: ERROR_STATUES.MESSAGE_TYPE_MISSED,
              });
          }
        });
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
    deleted_for: Joi.array().items(
      Joi.alternatives().try(Joi.object(), Joi.string()).required()
    ),
  }).required(),
};
