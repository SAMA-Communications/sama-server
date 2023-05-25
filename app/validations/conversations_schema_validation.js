import Joi from "joi";
import { ERROR_STATUES } from "./constants/errors.js";

export const conversationsSchemaValidation = {
  create: Joi.object({
    type: Joi.string()
      .valid("u", "g")
      .required()
      .error((errors) => {
        return errors.map((error) => {
          switch (error.code) {
            case "any.only":
              return new Error(ERROR_STATUES.INCORRECT_TYPE.message, {
                cause: ERROR_STATUES.INCORRECT_TYPE,
              });
            default:
              return new Error(ERROR_STATUES.CONVERSATION_TYPE_MISSED.message, {
                cause: ERROR_STATUES.CONVERSATION_TYPE_MISSED,
              });
          }
        });
      }),
    name: Joi.alternatives().conditional("type", {
      is: "g",
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
      then: Joi.alternatives().try(Joi.object(), Joi.string()).required(),
    }),
    //not needed field in validation
    owner_id: Joi.alternatives().try(Joi.object(), Joi.string()),
    participants: Joi.array()
      .items(Joi.alternatives().try(Joi.object(), Joi.string()).required())
      .min(1)
      .max(parseInt(process.env.CONVERSATION_MAX_PARTICIPANTS))
      .required()
      .error(
        new Error(ERROR_STATUES.USER_SELECTED.message, {
          cause: ERROR_STATUES.USER_SELECTED,
        })
      ),
  }).required(),
  update: Joi.object({
    id: Joi.string().required(),
    name: Joi.string().max(255),
    description: Joi.string().max(255),
    participants: Joi.object({
      add: Joi.array().items(
        Joi.alternatives().try(Joi.object(), Joi.string())
      ),
      remove: Joi.array().items(
        Joi.alternatives().try(Joi.object(), Joi.string())
      ),
    }),
  }),
  list: Joi.object({
    limit: Joi.number(),
    updated_at: Joi.object({
      gt: Joi.date(),
    }),
  }).required(),
  delete: Joi.object({
    id: Joi.string().required(),
  }).required(),
  getParticipantsByCids: Joi.object({
    cids: Joi.array()
      .items(Joi.alternatives().try(Joi.object(), Joi.string()))
      .required()
      .error(
        new Error(ERROR_STATUES.CIDS_REQUIRED.message, {
          cause: ERROR_STATUES.CIDS_REQUIRED,
        })
      ),
  }).required(),
};
