import { default as UsersXMPPController } from "../controllers/users.js";

import { usersSchemaValidation } from "../validations/users_schema_validation.js";

export const routes = {
  open: (ws, xmlElement) =>
    UsersXMPPController
    .validate(xmlElement, usersSchemaValidation.open)
    .open(ws, xmlElement),
};
