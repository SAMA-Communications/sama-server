import Joi from "joi";

export const operationsLogSchemaValidation = {
  logs: Joi.object({
    created_at: Joi.alternatives().try(
      Joi.object({
        gt: Joi.date().required(),
      }),
      Joi.object({
        lt: Joi.date().required(),
      })
    ),
  }).required(),
};
