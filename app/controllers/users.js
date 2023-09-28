import BaseController from "./base/base.js";
import BlockListRepository from "../repositories/blocklist_repository.js";
import BlockedUser from "../models/blocked_user.js";
import ContactsMatchRepository from "../repositories/contact_match_repository.js";
import SessionRepository from "../repositories/session_repository.js";
import User from "../models/user.js";
import UserToken from "../models/user_token.js";
import clusterManager from "../cluster/cluster_manager.js";
import ip from "ip";
import jwt from "jsonwebtoken";
import { ACTIVE } from "../store/session.js";
import { CONSTANTS } from "../validations/constants/constants.js";
import { ERROR_STATUES } from "../validations/constants/errors.js";
import { default as LastActivityiesController } from "./activities.js";
import { default as PacketProcessor } from "../routes/packet_processor.js";
import { inMemoryBlockList } from "../store/in_memory.js";

class UsersController extends BaseController {
  constructor() {
    super();
    this.blockListRepository = new BlockListRepository(
      BlockedUser,
      inMemoryBlockList
    );
    this.sessionRepository = new SessionRepository(ACTIVE);
    this.contactMatchRepository = new ContactsMatchRepository();
  }

  async create(ws, data) {
    const { id: requestId, user_create: reqData } = data;

    reqData.login = reqData.login.toLowerCase();

    const existingParam = [{ login: `/${reqData.login}/i` }];
    reqData.email && existingParam.push({ email: `/${reqData.email}/i` });
    reqData.phone && existingParam.push({ phone: `/${reqData.phone}/i` });
    const existingUser = await User.findOne({ $or: existingParam });
    if (existingUser) {
      throw new Error(ERROR_STATUES.USER_ALREADY_EXISTS.message, {
        cause: ERROR_STATUES.USER_ALREADY_EXISTS,
      });
    }

    reqData["recent_activity"] = Date.now() / 1000;
    const user = new User(reqData);
    await user.save();

    await this.contactMatchRepository.matchUserWithContactOnCreate(
      user.visibleParams()._id.toString(),
      user.params.phone,
      user.params.email
    );

    return { response: { id: requestId, user: user.visibleParams() } };
  }

  async login(ws, data) {
    const { id: requestId, user_login: userInfo } = data;
    const deviceId = userInfo.deviceId.toString();

    let user, token;
    if (userInfo.token) {
      token = await UserToken.findOne({
        token: userInfo.token,
        device_id: deviceId,
      });
      if (!token) {
        throw new Error(ERROR_STATUES.TOKEN_EXPIRED.message, {
          cause: ERROR_STATUES.TOKEN_EXPIRED,
        });
      }
      user = await User.findOne({ _id: token.params.user_id });
    } else {
      user = await User.findOne({ login: `/${userInfo.login}/i` });
      if (!user) {
        throw new Error(ERROR_STATUES.INCORRECT_LOGIN_OR_PASSWORD.message, {
          cause: ERROR_STATUES.INCORRECT_LOGIN_OR_PASSWORD,
        });
      }

      if (!(await user.isValidPassword(userInfo.password))) {
        throw new Error(ERROR_STATUES.INCORRECT_LOGIN_OR_PASSWORD.message, {
          cause: ERROR_STATUES.INCORRECT_LOGIN_OR_PASSWORD,
        });
      }
      token = await UserToken.findOne({
        user_id: user.params._id,
        device_id: deviceId,
      });
    }
    const userId = user.params._id;

    await PacketProcessor.maybeUpdateAndSendUserActivity(
      ws,
      { uId: userId, rId: requestId },
      "online"
    );

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
        try {
          ws.send(JSON.stringify({ error: "Device replacement" }));
          ws.close();
        } catch (e) {
          console.log("[ClientManager] missing connection with ws client");
        }
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
        expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN,
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

    await this.sessionRepository.storeUserNodeData(
      userId,
      deviceId,
      ip.address(),
      clusterManager.clusterPort
    );

    return {
      response: { id: requestId, user: user.visibleParams(), token: jwtToken },
    };
  }

  async edit(ws, data) {
    const {
      id: requestId,
      user_edit: {
        login,
        first_name,
        last_name,
        email,
        phone,
        current_password,
        new_password,
      },
    } = data;

    const userId = this.sessionRepository.getSessionUserId(ws);
    const currentUser = await User.findOne({ _id: userId });
    if (!currentUser) {
      throw new Error(ERROR_STATUES.USER_LOGIN_OR_PASS.message, {
        cause: ERROR_STATUES.USER_LOGIN_OR_PASS,
      });
    }

    if (
      new_password &&
      !(await currentUser.isValidPassword(current_password))
    ) {
      throw new Error(ERROR_STATUES.INCORRECT_CURRENT_PASSWORD.message, {
        cause: ERROR_STATUES.INCORRECT_CURRENT_PASSWORD,
      });
    }

    let updateParam = { updated_at: new Date() };

    if (new_password) {
      const updateUser = new User({ password: new_password });
      await updateUser.encryptAndSetPassword();

      updateParam["password_salt"] = updateUser.params.password_salt;
      updateParam["encrypted_password"] = updateUser.params.encrypted_password;
    }

    delete data.user_edit["new_password"];
    delete data.user_edit["current_password"];

    login && (updateParam["login"] = login);
    email && (updateParam["email"] = email);
    phone && (updateParam["phone"] = phone);
    first_name && (updateParam["first_name"] = first_name);
    last_name && (updateParam["last_name"] = last_name);

    const updateResponse = await User.findOneAndUpdate(
      { _id: userId },
      { $set: updateParam }
    );
    if (!updateResponse.ok) {
      throw new Error(ERROR_STATUES.USER_ALREADY_EXISTS.message, {
        cause: ERROR_STATUES.USER_ALREADY_EXISTS,
      });
    }
    const updatedUser = new User(updateResponse.value);

    await this.contactMatchRepository.matchUserWithContactOnUpdate(
      updatedUser.visibleParams()._id.toString(),
      phone,
      email,
      currentUser.visibleParams().phone,
      currentUser.visibleParams().email
    );

    return {
      response: { id: requestId, user: updatedUser.visibleParams() },
    };
  }

  async logout(ws, data) {
    const { id: requestId } = data;

    const currentUserSession = ACTIVE.SESSIONS.get(ws);
    const userId = currentUserSession.user_id;

    const deviceId = this.sessionRepository.getDeviceId(ws, userId);
    if (currentUserSession) {
      await PacketProcessor.maybeUpdateAndSendUserActivity(ws, {
        uId: userId,
        rId: requestId,
      });

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

      await this.sessionRepository.removeUserNodeData(
        userId,
        deviceId,
        ip.address(),
        clusterManager.clusterPort
      );

      return { response: { id: requestId, success: true } };
    } else {
      throw new Error(ERROR_STATUES.UNAUTHORIZED.message, {
        cause: ERROR_STATUES.UNAUTHORIZED,
      });
    }
  }

  async delete(ws, data) {
    const { id: requestId } = data;

    const userId = this.sessionRepository.getSessionUserId(ws);
    if (!userId) {
      throw new Error(ERROR_STATUES.FORBIDDEN.message, {
        cause: ERROR_STATUES.FORBIDDEN,
      });
    }

    await LastActivityiesController.status_unsubscribe(ws, {
      request: { id: requestId },
    });

    if (ACTIVE.SESSIONS.get(ws)) {
      delete ACTIVE.DEVICES[userId];
      await this.sessionRepository.clearUserNodeData(userId);
      ACTIVE.SESSIONS.delete(ws);
    }

    const user = await User.findOne({ _id: userId });
    if (!user) {
      throw new Error(ERROR_STATUES.FORBIDDEN.message, {
        cause: ERROR_STATUES.FORBIDDEN,
      });
    }

    await this.blockListRepository.delete(user.params._id);
    await this.contactMatchRepository.matchUserWithContactOnDelete(
      user.visibleParams()._id.toString(),
      user.params.phone,
      user.params.email
    );

    await user.delete();

    return { response: { id: requestId, success: true } };
  }

  async search(ws, data) {
    const { id: requestId, user_search: requestParam } = data;

    const limit =
      requestParam.limit > CONSTANTS.LIMIT_MAX
        ? CONSTANTS.LIMIT_MAX
        : requestParam.limit || CONSTANTS.LIMIT_MAX;

    const query = {
      login: { $regex: `^${requestParam.login.toLowerCase()}.*` },
      _id: {
        $nin: [
          this.sessionRepository.getSessionUserId(ws),
          ...requestParam.ignore_ids,
        ],
      },
    };

    const timeFromUpdate = requestParam.updated_at;
    if (timeFromUpdate && timeFromUpdate.gt) {
      query.updated_at = { $gt: new Date(timeFromUpdate.gt) };
    }
    const users = await User.findAll(query, ["_id", "login"], limit);

    return { response: { id: requestId, users: users } };
  }
}

export default new UsersController();
