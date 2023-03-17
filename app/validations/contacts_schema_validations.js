import Joi from "joi";

export const contactsSchemaValidation = {
  contact_add: Joi.object()
    .keys({
      first_name: Joi.string(),
      last_name: Joi.string(),
      company: Joi.string(),
      email: Joi.array(),
      phone: Joi.array(),
    })
    .or("email", "phone")
    .or("first_name", "last_name")
    .required(),
  contact_batch_add: Joi.object({
    users: Joi.array(),
  }).required(),
  contact_update: Joi.object({
    first_name: Joi.string(),
    last_name: Joi.string(),
    company: Joi.string(),
    email: Joi.array(),
    phone: Joi.array(),
  }).required(),
  contact_delete: Joi.object()
    .keys({
      email: Joi.array(),
      phone: Joi.array(),
    })
    .or("email", "phone")
    .required(),
  contact_list: Joi.object({}).required(),
};
