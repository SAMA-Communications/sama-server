import Joi from "joi";

export const usersSchemaValidation = {
  open: Joi.object({}).unknown(true).required(),
};
