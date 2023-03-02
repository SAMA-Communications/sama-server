import Joi from "joi";

export const messagesSchemaValidation = {
  // test this options
  create: Joi.alternatives().try(
    Joi.object({
      id: Joi.string().min(1).required(),
      cid: Joi.string().required(),
      x: Joi.object(),
      attachments: Joi.array()
        .items(
          Joi.object({
            file_id: Joi.string().required(),
            file_name: Joi.string().max(40).required(),
          }).required()
        )
        .min(1)
        .required(),
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
  }).required(),
  list: Joi.object({
    cid: Joi.string().required(),
    ids: Joi.array().items(Joi.string()).required(),
  }).required(),
  read: Joi.object({
    cid: Joi.string().required(),
    ids: Joi.array().items(Joi.string()).required(),
  }).required(),
  delete: Joi.object({
    cid: Joi.string().required(),
    type: Joi.string().min(1).required(),
    ids: Joi.array().items(Joi.string()).required(),
  }).required(),
};
