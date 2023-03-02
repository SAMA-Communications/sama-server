import Joi from "joi";

export const activitiesSchemaValidation = {
  statusSubscribe: Joi.object({
    id: Joi.string().required(),
  }).required(),
  statusUnsubscribe: Joi.object({}).required(),
  getUserStatus: Joi.object({
    ids: Joi.array().items(Joi.string().required()).required(),
  }).required(),
};
