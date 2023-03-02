import Joi from "joi";

export const conversationsSchemaValidation = {
  create: Joi.object({
    name: Joi.string().max(40).required(),
    description: Joi.string().max(255).required(),
    type: Joi.string().allow("u", "g").required(),
    participants: Joi.array()
      .items(Joi.string().required())
      .max(parseInt(process.env.CONVERSATION_MAX_PARTICIPANTS))
      .required(),
  }).required(),
  update: Joi.object({
    id: Joi.string().required(),
    name: Joi.string().max(40),
    description: Joi.string().max(255),
    participants: Joi.object({
      add: Joi.array().items(Joi.string()),
      remove: Joi.array().items(Joi.string()),
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
    cids: Joi.array().items(Joi.string().required()).required(),
  }).required(),
};
