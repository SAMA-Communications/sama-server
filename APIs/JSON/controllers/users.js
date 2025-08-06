import BaseJSONController from "./base.js"

import { CONSTANTS as MAIN_CONSTANTS } from "@sama/constants/constants.js"

import ServiceLocatorContainer from "@sama/common/ServiceLocatorContainer.js"

import Response from "@sama/networking/models/Response.js"
import LastActivityStatusResponse from "@sama/networking/models/LastActivityStatusResponse.js"

class UsersController extends BaseJSONController {
  async create(ws, data) {
    const { id: requestId, user_create: createUserParams } = data

    const userCreateOperation = ServiceLocatorContainer.use("UserCreateOperation")
    const user = await userCreateOperation.perform(createUserParams)

    return new Response().addBackMessage({ response: { id: requestId, user: user.visibleParams() } })
  }

  async connect(ws, data) {
    const { id: requestId, connect: userConnectionParams } = data

    const userConnectSocketOperation = ServiceLocatorContainer.use("UserConnectSocketOperation")
    const { user } = await userConnectSocketOperation.perform(ws, userConnectionParams)

    return new Response()
      .addBackMessage({ response: { id: requestId, success: true } })
      .updateLastActivityStatus(new LastActivityStatusResponse(user.native_id, MAIN_CONSTANTS.LAST_ACTIVITY_STATUS.ONLINE))
  }

  async login(ws, data) {
    const { id: requestId, user_login: userInfo } = data

    const userAuthOperation = ServiceLocatorContainer.use("UserAuthOperation")
    const { user, token } = await userAuthOperation.perform(ws, userInfo)

    return new Response()
      .addBackMessage({ response: { id: requestId, user: user.visibleParams(), token: token.token } })
      .updateLastActivityStatus(new LastActivityStatusResponse(user.native_id, MAIN_CONSTANTS.LAST_ACTIVITY_STATUS.ONLINE))
  }

  async edit(ws, data) {
    const { id: requestId, user_edit } = data

    const userEditOperation = ServiceLocatorContainer.use("UserEditOperation")
    const updatedUser = await userEditOperation.perform(ws, user_edit)

    return new Response().addBackMessage({ response: { id: requestId, user: updatedUser.visibleParams() } })
  }

  async logout(ws, data) {
    const { id: requestId } = data

    const userLogoutOperation = ServiceLocatorContainer.use("UserLogoutOperation")
    const userId = await userLogoutOperation.perform(ws)

    return new Response()
      .addBackMessage({ response: { id: requestId, success: true } })
      .updateLastActivityStatus(new LastActivityStatusResponse(userId, MAIN_CONSTANTS.LAST_ACTIVITY_STATUS.OFFLINE))
  }

  async delete(ws, data) {
    const { id: requestId } = data

    const userDeleteOperation = ServiceLocatorContainer.use("UserDeleteOperation")
    const userId = await userDeleteOperation.perform(ws)

    return new Response().addBackMessage({ response: { id: requestId, success: true } })
  }

  async search(ws, data) {
    const { id: requestId, user_search: searchParams } = data

    const userSearchOperation = ServiceLocatorContainer.use("UserSearchOperation")
    const usersSearchResult = await userSearchOperation.perform(ws, searchParams)

    return new Response().addBackMessage({ response: { id: requestId, users: usersSearchResult } })
  }

  async list(ws, data) {
    const { id: requestId, get_users_by_ids: userListParams } = data

    const userListOperation = ServiceLocatorContainer.use("UserListOperation")
    const userListResult = await userListOperation.perform(ws, userListParams)

    return new Response().addBackMessage({ response: { id: requestId, users: userListResult } })
  }
}

export default new UsersController()
