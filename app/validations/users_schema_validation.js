export default usersSchemaValidation = {
  create: Joi.object({
    login: Joi.string().min(2).max(30).required(),
    password: Joi.string().required(),
    deviceId: Joi.number(),
  }),
  login: Joi.object({
    login: Joi.string().min(2).max(30).required(),
    password: Joi.string().required(),
    deviceId: Joi.number(),
  }),
};
