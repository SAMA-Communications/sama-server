import Joi from "joi";

export const contactsSchemaValidation = {
  contact_add: Joi.object()
    .keys({
      first_name: Joi.string().min(2).max(255),
      last_name: Joi.string().min(2).max(255),
      company: Joi.string().min(2).max(255),
      email: Joi.array(),
      phone: Joi.array(),
    })
    .or("email", "phone")
    .or("first_name", "last_name")
    .required(),
  contact_batch_add: Joi.object({
    contacts: Joi.array().items(
      Joi.object()
        .keys({
          first_name: Joi.string().min(2).max(255),
          last_name: Joi.string().min(2).max(255),
          company: Joi.string().min(2).max(255),
          email: Joi.array(),
          phone: Joi.array(),
        })
        .or("email", "phone")
        .or("first_name", "last_name")
    ),
  }).required(),
  contact_update: Joi.object({
    id: Joi.string().required(),
    first_name: Joi.string().min(2).max(255),
    last_name: Joi.string().min(2).max(255),
    company: Joi.string().min(2).max(255),
    email: Joi.array(),
    phone: Joi.array(),
  }).required(),
  contact_delete: Joi.object({
    id: Joi.string().required(),
  }).required(),
  contact_list: Joi.object({
    updated_at: Joi.date(),
    limit: Joi.number(),
  }).required(),
};
