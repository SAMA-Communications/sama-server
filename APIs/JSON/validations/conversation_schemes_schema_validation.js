import Joi from "joi"

export const conversationSchemesSchemaValidation = {
  create: Joi.object({
    cid: Joi.string().required(),
    scheme: Joi.string().required(),
  }),
  get: Joi.object({
    cid: Joi.string().required(),
  }),
  delete: Joi.object({
    cid: Joi.string().required(),
  }),
}
