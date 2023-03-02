import Joi from "joi";

export const statusSchemaValidation = {
  typing: Joi.object({
    id: Joi.string().min(1).required(),
    cid: Joi.string().required(),
    type: Joi.string().allow("start", "stop"),
    t: Joi.number().required(),
  }),
};
