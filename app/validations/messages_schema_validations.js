import Joi from "joi";

export const messagesSchemaValidation = {
  // test this options
  create: Joi.object({
    id: Joi.string().min(1).required(),
    cid: Joi.string().required(),
    body: Joi.string().required(),
    x: Joi.object(),
    attachments: Joi.alternatives().conditional("body", {
      is: Joi.string(),
      then: Joi.array(),
      otherwise: Joi.array()
        .items(
          Joi.object({
            file_id: Joi.string().required(),
            file_name: Joi.string().max(40).required(),
          }).required()
        )
        .min(1)
        .required(),
    }),
  }),
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
