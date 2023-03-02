import Joi from "joi";

export const usersBlockSchemaValidation = {
  block: Joi.object({
    id: Joi.string().required(),
  }).required(),
  unblock: Joi.object({
    id: Joi.string().required(),
  }).required(),
  list: Joi.object({}).required(),
};
