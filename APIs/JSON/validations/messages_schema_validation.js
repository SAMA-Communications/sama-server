import Joi from 'joi'
import { ERROR_STATUES, requiredError } from '@sama/constants/errors.js'

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
        .allow('')
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
          })
        )
        .min(1)
        .error(
          new Error(ERROR_STATUES.MESSAGE_BODY_AND_ATTACHMENTS_EMPTY.message, {
            cause: ERROR_STATUES.MESSAGE_BODY_AND_ATTACHMENTS_EMPTY,
          })
        ),
      deleted_for: Joi.array().items(
        Joi.alternatives().try(Joi.object(), Joi.string(), Joi.number()).required()
      ),
    })
    .or('body', 'attachments'),
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
  list: Joi.object({
    cid: Joi.string()
      .required()
      .error(
        new Error(ERROR_STATUES.CID_REQUIRED.message, {
          cause: ERROR_STATUES.CID_REQUIRED,
        })
      ),
    limit: Joi.number(),
    updated_at: Joi.object().allow({ gt: Joi.date() }, { lt: Joi.date() }),
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
      .valid('all', 'myself')
      .required()
      .error((errors) => {
        return errors.map((error) => {
          switch (error.code) {
            case 'any.only':
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
    deleted_for: Joi.array().items(
      Joi.alternatives().try(Joi.object(), Joi.string(), Joi.number()).required()
    ),
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
      uids: Joi.array().items(
          Joi.alternatives().try(Joi.object(), Joi.string(), Joi.number()).required()
        ),
      x: Joi.object({}).unknown().required().error(requiredError(`'x'`))
    })
    .or('cid', 'uids').error((errors) => {
      console.log('[errors]', errors)
      return errors.map(error => {
        if (error instanceof Error) {
          return error
        }

        if (error.local.peers.toString() === 'cid,uids') {
          return requiredError(`'cid' or 'uids'`)
        }

        return error
      })
    })
    .oxor('cid', 'uids')
    .required()
}
