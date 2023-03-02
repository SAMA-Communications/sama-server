import Joi from "joi";

export const filesSchemaValidation = {
  createUrl: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().max(40).required(),
        size: Joi.number().required(),
        //TODO: add fixed types to allow()
        content_type: Joi.string().required(),
      })
    )
    .max(10)
    .required(),
  getDownloadUrl: Joi.object({
    file_ids: Joi.array().items(Joi.string()).max(10).required(),
  }).required(),
};
