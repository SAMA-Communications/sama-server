import Joi from "joi";
import { ERROR_STATUES } from "@sama/constants/errors.js";

export const filesSchemaValidation = {
  create_url: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().max(255).required(),
        size: Joi.number().required(),
        //TODO: add fixed list types to allow()
        content_type: Joi.string().required(),
      })
    )
    .max(10)
    .required()
    .error((errors) => {
      return errors.map((error) => {
        switch (error.code) {
          case "array.max":
            return new Error(ERROR_STATUES.FILE_LIMIT_EXCEEDED.message, {
              cause: ERROR_STATUES.FILE_LIMIT_EXCEEDED,
            });
          default:
            switch (error.local.key) {
              case "name":
                return new Error(ERROR_STATUES.INCORRECT_FILE_NAME.message, {
                  cause: ERROR_STATUES.INCORRECT_FILE_NAME,
                });
              case "size":
                return new Error(ERROR_STATUES.INCORRECT_FILE_SIZE.message, {
                  cause: ERROR_STATUES.INCORRECT_FILE_SIZE,
                });
              case "content_type":
                return new Error(ERROR_STATUES.INCORRECT_CONTENT_TYPE.message, {
                  cause: ERROR_STATUES.INCORRECT_CONTENT_TYPE,
                });
            }
        }
      });
    }),
  get_download_url: Joi.object({
    file_ids: Joi.array()
      .items(Joi.string())
      .min(1)
      .max(10)
      .required()
      .error((errors) => {
        return errors.map((error) => {
          switch (error.code) {
            case "array.max":
              return new Error(ERROR_STATUES.FILE_IDS_EXCEEDED.message, {
                cause: ERROR_STATUES.FILE_IDS_EXCEEDED,
              });
            default:
              return new Error(ERROR_STATUES.FILE_IDS_MISSED.message, {
                cause: ERROR_STATUES.FILE_IDS_MISSED,
              });
          }
        });
      }),
  }).required(),
};
