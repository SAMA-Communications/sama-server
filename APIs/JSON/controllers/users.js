import BaseJSONController from './base.js'

import { CONSTANTS as MAIN_CONSTANTS } from '@sama/constants/constants.js'
import { ERROR_STATUES } from '@sama/constants/errors.js'

import RuntimeDefinedContext from '@sama/store/RuntimeDefinedContext.js'
import ServiceLocatorContainer from '@sama/common/ServiceLocatorContainer.js'
import { ACTIVE } from '@sama/store/session.js'

import UserToken from '@sama/models/user_token.js'

import blockListRepository from '@sama/repositories/blocklist_repository.js'
import contactsMatchRepository from '@sama/repositories/contact_match_repository.js'
import sessionRepository from '@sama/repositories/session_repository.js'

import Response from '@sama/networking/models/Response.js'
import LastActivityStatusResponse from '@sama/networking/models/LastActivityStatusResponse.js'

class UsersController extends BaseJSONController {
  async create(ws, data) {
    const { id: requestId, user_create: createUserParams } = data
    const userService = ServiceLocatorContainer.use('UserService')

    const existingUser = await userService.userRepo.findExisted(createUserParams.login, createUserParams.email, createUserParams.phone)
    if (existingUser) {
      throw new Error(ERROR_STATUES.USER_ALREADY_EXISTS.message, {
        cause: ERROR_STATUES.USER_ALREADY_EXISTS,
      })
    }

    const user = await userService.create(createUserParams)

    await contactsMatchRepository.matchUserWithContactOnCreate(
      user.visibleParams()._id.toString(),
      user.params.phone,
      user.params.email
    )

    return new Response().addBackMessage({ response: { id: requestId, user: user.visibleParams() } })
  }

  async login(ws, data) {
    const { id: requestId, user_login: userInfo } = data
  
    const userAuthOperation = ServiceLocatorContainer.use('UserAuthOperation')
    const { user, token } = await userAuthOperation.perform(ws, userInfo)
    
    return new Response()
      .addBackMessage({ response: { id: requestId, user: user.visibleParams(), token: token.params.token } })
      .updateLastActivityStatus(new LastActivityStatusResponse(user.params._id, MAIN_CONSTANTS.LAST_ACTIVITY_STATUS.ONLINE))
  }

  async edit(ws, data) {
    const { id: requestId, user_edit } = data

    const userService = ServiceLocatorContainer.use('UserService')

    const userId = sessionRepository.getSessionUserId(ws)
    const currentUser = await userService.userRepo.findById(userId)
    if (!currentUser) {
      throw new Error(ERROR_STATUES.USER_LOGIN_OR_PASS.message, {
        cause: ERROR_STATUES.USER_LOGIN_OR_PASS,
      })
    }

    const updatedUser = await userService.update(currentUser, user_edit)

    await contactsMatchRepository.matchUserWithContactOnUpdate(
      updatedUser.visibleParams()._id.toString(),

      updatedUser.visibleParams().phone,
      updatedUser.visibleParams().email,

      currentUser.visibleParams().phone,
      currentUser.visibleParams().email
    )

    return new Response().addBackMessage({
      response: { id: requestId, user: updatedUser.visibleParams() },
    })
  }

  async logout(ws, data) {
    const { id: requestId } = data

    const currentUserSession = ACTIVE.SESSIONS.get(ws)
    const userId = currentUserSession.user_id

    const deviceId = sessionRepository.getDeviceId(ws, userId)
    if (currentUserSession) {
      if (ACTIVE.DEVICES[userId].length > 1) {
        ACTIVE.DEVICES[userId] = ACTIVE.DEVICES[userId].filter((obj) => {
          return obj.deviceId !== deviceId
        })
      } else {
        delete ACTIVE.DEVICES[userId]
        ACTIVE.SESSIONS.delete(ws)
      }

      const userToken = await UserToken.findOne({
        user_id: userId,
        device_id: deviceId,
      })
      userToken.delete()

      await sessionRepository.removeUserNodeData(
        userId,
        deviceId,
        RuntimeDefinedContext.APP_IP,
        RuntimeDefinedContext.CLUSTER_PORT
      )

      return new Response()
        .addBackMessage({ response: { id: requestId, success: true } })
        .updateLastActivityStatus(new LastActivityStatusResponse(userId, MAIN_CONSTANTS.LAST_ACTIVITY_STATUS.OFFLINE))
    } else {
      throw new Error(ERROR_STATUES.UNAUTHORIZED.message, {
        cause: ERROR_STATUES.UNAUTHORIZED,
      })
    }
  }

  async delete(ws, data) {
    const { id: requestId } = data
    const userService = ServiceLocatorContainer.use('UserService')

    const userId = sessionRepository.getSessionUserId(ws)
    if (!userId) {
      throw new Error(ERROR_STATUES.FORBIDDEN.message, {
        cause: ERROR_STATUES.FORBIDDEN,
      })
    }

    const activityManagerService = ServiceLocatorContainer.use('ActivityManagerService')
    await activityManagerService.unsubscribeObserver(userId)

    if (ACTIVE.SESSIONS.get(ws)) {
      delete ACTIVE.DEVICES[userId]
      await sessionRepository.clearUserNodeData(userId)
      ACTIVE.SESSIONS.delete(ws)
    }

    const user = await userService.userRepo.findById(userId)
    if (!user) {
      throw new Error(ERROR_STATUES.FORBIDDEN.message, {
        cause: ERROR_STATUES.FORBIDDEN,
      })
    }

    await blockListRepository.delete(user.params._id)
    await contactsMatchRepository.matchUserWithContactOnDelete(
      user.visibleParams()._id.toString(),
      user.params.phone,
      user.params.email
    )

    await userService.userRepo.deleteById(userId)

    return new Response().addBackMessage({ response: { id: requestId, success: true } })
  }

  async search(ws, data) {
    const { id: requestId, user_search: requestParam } = data
    const userService = ServiceLocatorContainer.use('UserService')

    const currentUserId = sessionRepository.getSessionUserId(ws)
    const ignoreIds = [currentUserId, ...requestParam.ignore_ids]

    const limit = requestParam.limit > MAIN_CONSTANTS.LIMIT_MAX ? MAIN_CONSTANTS.LIMIT_MAX : requestParam.limit || MAIN_CONSTANTS.LIMIT_MAX

    const users = await userService.userRepo.search({ loginMatch: requestParam.login, ignoreIds, timeFromUpdate: requestParam.updated_at?.gt }, limit)

    const usersSearchResult = users.map(user => ({ _id: user.params._id, login: user.params.login }))

    return new Response().addBackMessage({ response: { id: requestId, users: usersSearchResult } })
  }
}

export default new UsersController()
