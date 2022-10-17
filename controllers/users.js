import OfflineQueue from "../models/offline_queue.js";
import User from "../models/user.js";
import jwt from "jsonwebtoken";
import validate, { validateDeviceId } from "../lib/validation.js";
import { ACTIVE, getDeviceId, getSessionUserId } from "../models/active.js";
import { ALLOW_FIELDS } from "../constants/fields_constants.js";
import { ERROR_STATUES } from "../constants/http_constants.js";
import { slice } from "../utils/req_res_utils.js";

export default class UsersController {
  async create(ws, data) {
    const requestId = data.request.id;

    const userParams = slice(
      data.request.user_create,
      ALLOW_FIELDS.ALLOWED_FIELDS_USER_CREATE
    );

    const isUserCreate = await User.findOne({ login: userParams.login });
    if (!isUserCreate) {
      userParams.token = "";
      const user = new User(userParams);
      await user.save();

      return { response: { id: requestId, user: user.visibleParams() } };
    } else {
      throw new Error(ERROR_STATUES.USER_ALREADY_EXISTS.message, {
        cause: ERROR_STATUES.USER_ALREADY_EXISTS,
      });
    }
  }

  async login(ws, data) {
    const requestId = data.request.id;
    const userInfo = data.request.user_login;
    await validate(ws, userInfo, [validateDeviceId]);

    let user;
    if (!userInfo.token) {
      user = await User.findOne({ login: userInfo.login });
      if (!user) {
        throw new Error(ERROR_STATUES.UNAUTHORIZED.message, {
          cause: ERROR_STATUES.UNAUTHORIZED,
        });
      }

      if (!(await user.isValidPassword(userInfo.password))) {
        throw new Error(ERROR_STATUES.UNAUTHORIZED.message, {
          cause: ERROR_STATUES.UNAUTHORIZED,
        });
      }
    } else {
      user = await User.findOne({ token: userInfo.token });
      if (!user) {
        throw new Error(ERROR_STATUES.INCORRECT_SESSION_ID.message, {
          cause: ERROR_STATUES.INCORRECT_SESSION_ID,
        });
      }
    }
    const userId = user.params._id;
    const deviceId = userInfo.deviceId;

    const activeConnections = ACTIVE.DEVICES[userId];
    if (activeConnections) {
      let wsToClose = [];
      const devices = activeConnections.filter((obj) => {
        if (obj.deviceId !== deviceId) {
          return true;
        } else {
          wsToClose.push(obj.ws);
          return false;
        }
      });
      wsToClose.forEach((ws) => {
        ws.send(JSON.stringify({ error: "Device replacement" }));
        ws.close();
      });
      ACTIVE.DEVICES[userId] = [...devices, { ws, deviceId }];
    } else {
      ACTIVE.DEVICES[userId] = [{ ws, deviceId }];
    }
    ACTIVE.SESSIONS[ws] = { user_id: userId };

    const expectedReqs = await OfflineQueue.findAll({
      user_id: userId,
    });
    if (expectedReqs && expectedReqs.length) {
      for (const current in expectedReqs) {
        ws.send(expectedReqs[current].request);
      }
      await OfflineQueue.deleteMany({ user_id: userId });
    }
    const token = jwt
      .sign(user.visibleParams(), process.env.JWT_ACCESS_SECRET, {
        expiresIn: "2d",
      })
      .split(".")[1];
    await User.updateOne(user.params, { $set: { token: token } });

    return { response: { id: requestId, token: token } };
  }

  async logout(ws, data) {
    const requestId = data.request.id;

    const currentUserSession = ACTIVE.SESSIONS[ws];
    const userId = currentUserSession.user_id;

    const deviceId = getDeviceId(ws, userId);
    if (currentUserSession) {
      if (ACTIVE.DEVICES[userId].length > 1) {
        ACTIVE.DEVICES[userId] = ACTIVE.DEVICES[userId].filter((obj) => {
          return obj.deviceId !== deviceId;
        });
      } else {
        delete ACTIVE.DEVICES[userId];
        delete ACTIVE.SESSIONS[ws];
      }

      return { response: { id: requestId, success: true } };
    } else {
      throw new Error(ERROR_STATUES.UNAUTHORIZED.message, {
        cause: ERROR_STATUES.UNAUTHORIZED,
      });
    }
  }

  async delete(ws, data) {
    const requestId = data.request.id;

    const userSession = getSessionUserId(ws);
    if (!userSession) {
      throw new Error(ERROR_STATUES.FORBIDDEN.message, {
        cause: ERROR_STATUES.FORBIDDEN,
      });
    }

    if (ACTIVE.SESSIONS[ws]) {
      delete ACTIVE.DEVICES[userSession];
      delete ACTIVE.SESSIONS[ws];
    }

    const user = await User.findOne({ _id: userSession });
    if (user) {
      await user.delete();
      return { response: { id: requestId, success: true } };
    } else {
      throw new Error(ERROR_STATUES.FORBIDDEN.message, {
        cause: ERROR_STATUES.FORBIDDEN,
      });
    }
  }
}
