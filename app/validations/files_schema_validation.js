import Joi from "joi";
import { ERROR_STATUES } from "./constants/errors.js";

export const filesSchemaValidation = {
  createUrl: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().max(40).required(),
        size: Joi.number().required(),
        //TODO: add fixed list types to allow()
        content_type: Joi.string().required(),
      })
    )
    .max(10)
    .required()
    .error((errors) => {
      return errors.map((error) => {
        console.log(error);
        switch (error.code) {
          case "array.max":
            return new Error(ERROR_STATUES.FILE_LIMIT_EXCEEDED.message, {
              cause: ERROR_STATUES.FILE_LIMIT_EXCEEDED,
            });
          case "any.required":
            switch (error.local.key) {
              case "name":
                return new Error(ERROR_STATUES.FILE_NAME_MISSED.message, {
                  cause: ERROR_STATUES.FILE_NAME_MISSED,
                });
              case "size":
                return new Error(ERROR_STATUES.FILE_SIZE_MISSED.message, {
                  cause: ERROR_STATUES.FILE_SIZE_MISSED,
                });
              case "content_type":
                return new Error(
                  ERROR_STATUES.FILE_CONTENT_TYPE_MISSED.message,
                  {
                    cause: ERROR_STATUES.FILE_CONTENT_TYPE_MISSED,
                  }
                );
            }
        }
      });
    }),
  getDownloadUrl: Joi.object({
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
