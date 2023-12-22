import Joi from "joi";
import { ERROR_STATUES } from "@sama/constants/errors.js";

export const contactsSchemaValidation = {
  contact_add: Joi.object()
    .keys({
      first_name: Joi.string().min(2).max(255),
      last_name: Joi.string().min(2).max(255),
      company: Joi.string().min(2).max(255),
      email: Joi.array().items({
        type: Joi.string(),
        value: Joi.string(),
      }),
      phone: Joi.array().items({
        type: Joi.string(),
        value: Joi.string(),
      }),
    })
    .or("email", "phone")
    .or("first_name", "last_name")
    .error((errors) => {
      return errors.map((error) => {
        switch (error.local.peers.toString()) {
          case "email,phone":
            return new Error(ERROR_STATUES.EMAIL_OR_PHONE_IS_MISSED.message, {
              cause: ERROR_STATUES.EMAIL_OR_PHONE_IS_MISSED,
            });
          case "first_name,last_name":
            return new Error(ERROR_STATUES.FULLNAME_IS_MISSED.message, {
              cause: ERROR_STATUES.FULLNAME_IS_MISSED,
            });
        }
      });
    })
    .required(),
  contact_batch_add: Joi.object({
    contacts: Joi.array().items(
      Joi.object()
        .keys({
          first_name: Joi.string().min(2).max(255),
          last_name: Joi.string().min(2).max(255),
          company: Joi.string().min(2).max(255),
          email: Joi.array().items({
            type: Joi.string(),
            value: Joi.string(),
          }),
          phone: Joi.array().items({
            type: Joi.string(),
            value: Joi.string(),
          }),
        })
        .or("email", "phone")
        .or("first_name", "last_name")
        .error((errors) => {
          return errors.map((error) => {
            switch (error.local.peers.toString()) {
              case "email,phone":
                return new Error(
                  ERROR_STATUES.EMAIL_OR_PHONE_IS_MISSED.message,
                  {
                    cause: ERROR_STATUES.EMAIL_OR_PHONE_IS_MISSED,
                  }
                );
              case "first_name,last_name":
                return new Error(ERROR_STATUES.FULLNAME_IS_MISSED.message, {
                  cause: ERROR_STATUES.FULLNAME_IS_MISSED,
                });
            }
          });
        })
    ),
  }).required(),
  contact_update: Joi.object({
    id: Joi.string()
      .required()
      .error(
        new Error(ERROR_STATUES.CONTACT_ID_MISSED.message, {
          cause: ERROR_STATUES.CONTACT_ID_MISSED,
        })
      ),
    first_name: Joi.string().min(2).max(255),
    last_name: Joi.string().min(2).max(255),
    company: Joi.string().min(2).max(255),
    email: Joi.array().items({
      type: Joi.string(),
      value: Joi.string(),
    }),
    phone: Joi.array().items({
      type: Joi.string(),
      value: Joi.string(),
    }),
  }).required(),
  contact_delete: Joi.object({
    id: Joi.string()
      .required()
      .error(
        new Error(ERROR_STATUES.CONTACT_ID_MISSED.message, {
          cause: ERROR_STATUES.CONTACT_ID_MISSED,
        })
      ),
  }).required(),
  contact_list: Joi.object({
    updated_at: Joi.date(),
    limit: Joi.number(),
  }).required(),
};
