import Joi from "joi"

export const conversationHandlersSchemaValidation = {
  create: Joi.object({
    cid: Joi.string().required(),
    content: Joi.string().required(),
  }),
  get: Joi.object({
    cid: Joi.string().required(),
  }),
  delete: Joi.object({
    cid: Joi.string().required(),
  }),
}
