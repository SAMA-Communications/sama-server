import Joi from "joi";

export const messagesSchemaValidation = {
  // test this options
  create: Joi.alternatives().try(
    Joi.object({
      id: Joi.string().min(1).required(),
      cid: Joi.string().required(),
      x: Joi.object(),
      attachments: Joi.array().items(Joi.object().required()).required(),
    }),
    Joi.object({
      id: Joi.string().min(1).required(),
      body: Joi.string().required(),
      cid: Joi.string().required(),
      x: Joi.object(),
      attachments: Joi.array(),
    })
  ),
  edit: Joi.object({
    id: Joi.string().min(1).required(),
    body: Joi.string().required(),
  }),
  list: Joi.object({
    cid: Joi.string().required(),
    ids: Joi.array().items(Joi.string()).required(),
  }),
  read: Joi.object({
    cid: Joi.string().required(),
    ids: Joi.array().items(Joi.string()).required(),
  }),
  delete: Joi.object({
    cid: Joi.string().required(),
    type: Joi.string().min(1).required(),
    ids: Joi.array().items(Joi.string()).required(),
  }),
};
