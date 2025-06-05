import Joi from "joi"
import { ERROR_STATUES } from "@sama/constants/errors.js"

export const conversationsSchemaValidation = {
  create: Joi.object({
    type: Joi.string()
      .valid("u", "g", "c")
      .required()
      .error((errors) => {
        return errors.map((error) => {
          switch (error.code) {
            case "any.only":
              return new Error(ERROR_STATUES.INCORRECT_TYPE.message, {
                cause: ERROR_STATUES.INCORRECT_TYPE,
              })
            default:
              return new Error(ERROR_STATUES.CONVERSATION_TYPE_MISSED.message, {
                cause: ERROR_STATUES.CONVERSATION_TYPE_MISSED,
              })
          }
        })
      }),
    name: Joi.alternatives().conditional("type", {
      is: Joi.string().valid("g", "c"),
      then: Joi.string()
        .max(255)
        .required()
        .error(
          new Error(ERROR_STATUES.CONVERSATION_NAME_MISSED.message, {
            cause: ERROR_STATUES.CONVERSATION_NAME_MISSED,
          })
        ),
      otherwise: Joi.string().max(255),
    }),
    description: Joi.string().max(255),
    opponent_id: Joi.alternatives().conditional("type", {
      is: "u",
      then: Joi.alternatives().try(Joi.object(), Joi.string(), Joi.number()),
    }),
    //not needed field in validation
    owner_id: Joi.alternatives().try(Joi.object(), Joi.string(), Joi.number()),
    participants: Joi.array()
      .items(Joi.alternatives().try(Joi.object(), Joi.string(), Joi.number()).required())
      .min(1)
      .max(parseInt(process.env.CONVERSATION_MAX_PARTICIPANTS))
      .when("type", {
        is: Joi.string().valid("c"),
        then: Joi.optional(),
        otherwise: Joi.required()
      })
      .error((errors) => {
        return errors.map((error) => {
          switch (error.code) {
            case "array.max":
              return new Error(ERROR_STATUES.TOO_MANY_USERS_IN_GROUP.message, {
                cause: ERROR_STATUES.TOO_MANY_USERS_IN_GROUP,
              })
            default:
              return new Error(ERROR_STATUES.USER_SELECTED.message, {
                cause: ERROR_STATUES.USER_SELECTED,
              })
          }
        })
      }),
    image_object: Joi.object({
      file_id: Joi.string(),
      file_name: Joi.string().max(255),
      file_blur_hash: Joi.string().max(255),
    }),
  }).required(),
  update: Joi.object({
    id: Joi.string().required(),
    name: Joi.string().max(255),
    description: Joi.string().max(255),
    participants: Joi.object({
      add: Joi.array().items(Joi.alternatives().try(Joi.object(), Joi.string(), Joi.number())),
      remove: Joi.array().items(Joi.alternatives().try(Joi.object(), Joi.string(), Joi.number())),
    }),
    admins: Joi.object({
      add: Joi.array().items(Joi.alternatives().try(Joi.object(), Joi.string(), Joi.number())),
      remove: Joi.array().items(Joi.alternatives().try(Joi.object(), Joi.string(), Joi.number())),
    }),
    image_object: Joi.object({
      file_id: Joi.string(),
      file_name: Joi.string().max(255),
      file_blur_hash: Joi.string().max(255),
    }),
  }),
  list: Joi.object({
    limit: Joi.number(),
    updated_at: Joi.object({
      gt: Joi.date(),
      lt: Joi.date(),
    }),
    ids: Joi.array().items(Joi.alternatives().try(Joi.object(), Joi.string())).max(10),
  }).required(),
  delete: Joi.object({
    id: Joi.string().required(),
  }).required(),
  get_participants_by_cids: Joi.object({
    cids: Joi.array()
      .items(Joi.alternatives().try(Joi.object(), Joi.string()))
      .required()
      .error(
        new Error(ERROR_STATUES.CIDS_REQUIRED.message, {
          cause: ERROR_STATUES.CIDS_REQUIRED,
        })
      ),
  }).required(),
  get_admins_by_cids: Joi.object({
    cids: Joi.array()
      .items(Joi.alternatives().try(Joi.object(), Joi.string()))
      .required()
      .error(
        new Error(ERROR_STATUES.CIDS_REQUIRED.message, {
          cause: ERROR_STATUES.CIDS_REQUIRED,
        })
      ),
  }).required(),
  search: Joi.object({
    name: Joi.string().required(),
    limit: Joi.number().min(1).max(100),
    updated_at: Joi.object({
      gt: Joi.date(),
    }),
  }).required(),
  subscribe: Joi.object({
    cid: Joi.alternatives().try(Joi.object(), Joi.string())
  }),
  unsubscribe: Joi.object({
    cid: Joi.alternatives().try(Joi.object(), Joi.string())
  })
}
