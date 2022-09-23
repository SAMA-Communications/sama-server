import ACTIVE from "../models/active.js";
import OfflineQueue from "../models/offline_queue.js";
import User from "../models/user.js";
import UserSession from "../models/user_session.js";
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
      const user = new User(userParams);
      await user.save();

      return { response: { id: requestId, user: user.toJSON() } };
    } else {
      return {
        response: {
          id: requestId,
          error: ERROR_STATUES.USER_MISSED,
        },
      };
    }
  }

  async login(ws, data) {
    const requestId = data.request.id;

    const userInfo = data.request.user_login;
    const user = await User.findOne({ login: userInfo.login });
    if (!user) {
      return {
        response: {
          id: requestId,
          error: ERROR_STATUES.UNAUTHORIZED,
        },
      };
    }

    if (!(await user.isValidPassword(userInfo.password))) {
      return {
        response: {
          id: requestId,
          error: ERROR_STATUES.UNAUTHORIZED,
        },
      };
    }

    const userSession = new UserSession({ user_id: user.params._id });
    await userSession.save();

    ACTIVE.SESSIONS[ws] = { userSession: userSession.params };
    ACTIVE.CONNECTIONS[userSession.params.user_id] = ws;

    const respData = {
      token: userSession.params._id,
      user: user.visibleParams(),
    };

    const expectedReqs = await OfflineQueue.findAll({
      user_id: user.params._id,
    });
    if (expectedReqs && expectedReqs.length) {
      for (const current in expectedReqs) {
        ws.send(expectedReqs[current].request);
      }
      await OfflineQueue.deleteMany({ user_id: user.params._id });
    }

    return { response: { id: requestId, user: respData } };
  }

  async logout(ws, data) {
    const requestId = data.request.id;

    const sessionId = data.request.user_logout.token;
    const currentUserSession = await UserSession.findOne({ _id: sessionId });
    if (currentUserSession) {
      delete ACTIVE.CONNECTIONS[currentUserSession.params.user_id];
      delete ACTIVE.SESSIONS[ws];
      await currentUserSession.delete();
      return { response: { id: requestId, success: true } };
    } else {
      return {
        response: {
          id: requestId,
          error: ERROR_STATUES.UNAUTHORIZED,
        },
      };
    }
  }

  async delete(ws, data) {
    const requestId = data.request.id;

    const userSession = ACTIVE.SESSIONS[ws].userSession;
    if (userSession.user_id.toString() !== data.request.user_delete.id) {
      return {
        response: {
          id: requestId,
          error: ERROR_STATUES.FORBIDDEN,
        },
      };
    }

    const userId = data.request.user_delete.id;
    const currentUserSession = await UserSession.findOne({
      user_id: userId,
    });

    if (currentUserSession) {
      delete ACTIVE.CONNECTIONS[currentUserSession.params.user_id];
      delete ACTIVE.SESSIONS[ws];
      await currentUserSession.delete();
    }

    const user = await User.findOne({ _id: userId });
    if (user) {
      await user.delete();
      return { response: { id: requestId, success: true } };
    } else {
      return {
        response: {
          id: requestId,
          error: ERROR_STATUES.UNAUTHORIZED,
        },
      };
    }
  }
}
