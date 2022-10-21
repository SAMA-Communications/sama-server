import OfflineQueue from "../models/offline_queue.js";
import User from "../models/user.js";
import UserToken from "../models/user_token.js";
import jwt from "jsonwebtoken";
import validate, { validateDeviceId } from "../lib/validation.js";
import { ACTIVE, getDeviceId, getSessionUserId } from "../models/active.js";
import { ALLOW_FIELDS } from "../constants/fields_constants.js";
import { ERROR_STATUES } from "../constants/http_constants.js";
import { slice } from "../utils/req_res_utils.js";
import { CONSTANTS } from "../constants/constants.js";

export default class UsersController {
  async create(ws, data) {
    const requestId = data.request.id;

    const userParams = slice(
      data.request.user_create,
      ALLOW_FIELDS.ALLOWED_FIELDS_USER_CREATE
    );

    const isUserCreate = await User.findOne({ login: userParams.login });
    if (!isUserCreate) {
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

    let user, token;
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
      token = await UserToken.findOne({
        user_id: user.params._id,
        device_id: userInfo.deviceId,
      });
    } else {
      token = await UserToken.findOne({
        token: userInfo.token,
        device_id: userInfo.deviceId,
      });
      if (!token) {
        throw new Error(ERROR_STATUES.TOKEN_EXPIRED.message, {
          cause: ERROR_STATUES.TOKEN_EXPIRED,
        });
      }
      user = await User.findOne({ _id: token.params.user_id });
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
    ACTIVE.SESSIONS.set(ws, { user_id: userId });

    const jwtToken = jwt.sign(
      { _id: user.params._id, login: user.params.login },
      process.env.JWT_ACCESS_SECRET,
      {
        expiresIn: process.env.EXPIRES_IN,
      }
    );

    if (!token) {
      const userToken = new UserToken({
        user_id: user.params._id,
        device_id: deviceId,
        token: jwtToken,
      });
      await userToken.save();
    } else {
      await UserToken.updateOne(
        {
          user_id: token.params.user_id,
          device_id: deviceId,
        },
        { $set: { token: jwtToken } }
      );
    }

    const expectedReqs = await OfflineQueue.findAll({
      user_id: userId,
    });
    if (expectedReqs && expectedReqs.length) {
      setImmediate(async () => {
        for (const current in expectedReqs) {
          ws.send(JSON.stringify(expectedReqs[current].request));
        }
        await OfflineQueue.deleteMany({ user_id: userId });
      });
    }

    return {
      response: { id: requestId, user: user.visibleParams(), token: jwtToken },
    };
  }

  async logout(ws, data) {
    const requestId = data.request.id;

    const currentUserSession = ACTIVE.SESSIONS.get(ws);
    const userId = currentUserSession.user_id;

    const deviceId = getDeviceId(ws, userId);
    if (currentUserSession) {
      if (ACTIVE.DEVICES[userId].length > 1) {
        ACTIVE.DEVICES[userId] = ACTIVE.DEVICES[userId].filter((obj) => {
          return obj.deviceId !== deviceId;
        });
      } else {
        delete ACTIVE.DEVICES[userId];
        ACTIVE.SESSIONS.delete(ws);
      }

      const userToken = await UserToken.findOne({
        user_id: userId,
        device_id: deviceId,
      });
      userToken.delete();

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

    if (ACTIVE.SESSIONS.get(ws)) {
      delete ACTIVE.DEVICES[userSession];
      ACTIVE.SESSIONS.delete(ws);
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

  async search(ws, data) {
    const requestId = data.request.id;
    const requestParam = data.request.user_search;

    const limit =
      requestParam.limit > CONSTANTS.LIMIT_MAX
        ? CONSTANTS.LIMIT_MAX
        : requestParam.limit || CONSTANTS.LIMIT_MAX;
    const query = {
      login: { $regex: `^(?i)${requestParam.login}*` },
      _id: {
        $ne: getSessionUserId(ws),
      },
    };
    const timeFromUpdate = requestParam.updated_at;
    if (timeFromUpdate) {
      query.updated_at = { $gt: new Date(timeFromUpdate.gt) };
    }
    const users = await User.findAll(query, null, limit);

    return { response: { id: requestId, users: users } };
  }
}
