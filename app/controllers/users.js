import BaseController from "./base/base.js";
import BlockListRepository from "../repositories/blocklist_repository.js";
import BlockedUser from "../models/blocked_user.js";
import MatchedRepository from "../repositories/matched_repository.js";
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
    this.matchedRepository = new MatchedRepository();
  }

  async create(ws, data) {
    const { id: requestId, user_create: reqData } = data;

    const isUserCreate = await User.findOne({ login: reqData.login });
    if (!isUserCreate) {
      reqData["recent_activity"] = Date.now();
      const user = new User(reqData);
      await user.save();

      user.params.email &&
        (await this.matchedRepository.matchedContact(user.visibleParams(), {
          addRecord: 1,
          field: "email",
        }));
      user.params.phone &&
        (await this.matchedRepository.matchedContact(user.visibleParams(), {
          addRecord: 1,
          field: "phone",
        }));

      return { response: { id: requestId, user: user.visibleParams() } };
    } else {
      throw new Error(ERROR_STATUES.USER_ALREADY_EXISTS.message, {
        cause: ERROR_STATUES.USER_ALREADY_EXISTS,
      });
    }
  }

  async login(ws, data) {
    const { id: requestId, user_login: userInfo } = data;
    const deviceId = userInfo.deviceId.toString();

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
        device_id: deviceId,
      });
    } else {
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
      user_edit: { current_password, new_password },
    } = data;

    const userId = this.sessionRepository.getSessionUserId(ws);
    const currentUser = await User.findOne({ _id: userId });
    if (!currentUser) {
      throw new Error(ERROR_STATUES.USER_LOGIN_OR_PASS.message, {
        cause: ERROR_STATUES.USER_LOGIN_OR_PASS,
      });
    }

    if (
      current_password &&
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

    for (const field in data.user_edit) {
      updateParam[field] = data.user_edit[field];
    }

    const updatedUser = new User(
      (
        await User.findOneAndUpdate({ _id: userId }, { $set: updateParam })
      )?.value
    );

    const email = data.user_edit.email;
    const phone = data.user_edit.phone;
    if (email) {
      await this.matchedRepository.matchedContact(currentUser.visibleParams(), {
        removeRecord: 0,
        field: "email",
      });
      await this.matchedRepository.matchedContact(updatedUser.visibleParams(), {
        addRecord: 1,
        field: "email",
      });
    }

    if (phone) {
      await this.matchedRepository.matchedContact(currentUser.visibleParams(), {
        removeRecord: 0,
        field: "phone",
      });
      await this.matchedRepository.matchedContact(updatedUser.visibleParams(), {
        addRecord: 1,
        field: "phone",
      });
    }

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

    await LastActivityiesController.statusUnsubscribe(ws, {
      request: { id: requestId },
    });

    if (ACTIVE.SESSIONS.get(ws)) {
      delete ACTIVE.DEVICES[userId];
      await this.sessionRepository.clearUserNodeData(userId);
      ACTIVE.SESSIONS.delete(ws);
    }

    const user = await User.findOne({ _id: userId });
    if (user) {
      this.blockListRepository.delete(user.params._id);

      user.params.email &&
        (await this.matchedRepository.matchedContact(user.visibleParams(), {
          removeRecord: 1,
          field: "email",
        }));
      user.params.phone &&
        (await this.matchedRepository.matchedContact(user.visibleParams(), {
          removeRecord: 1,
          field: "phone",
        }));
      await user.delete();

      return { response: { id: requestId, success: true } };
    } else {
      throw new Error(ERROR_STATUES.FORBIDDEN.message, {
        cause: ERROR_STATUES.FORBIDDEN,
      });
    }
  }

  async search(ws, data) {
    const { id: requestId, user_search: requestParam } = data;

    const limit =
      requestParam.limit > CONSTANTS.LIMIT_MAX
        ? CONSTANTS.LIMIT_MAX
        : requestParam.limit || CONSTANTS.LIMIT_MAX;

    const query = {
      login: { $regex: `^${requestParam.login}.*` },
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
