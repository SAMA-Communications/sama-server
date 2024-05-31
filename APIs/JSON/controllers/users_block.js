import BaseJSONController from "./base.js"

import ServiceLocatorContainer from "@sama/common/ServiceLocatorContainer.js"

import blockListRepository from "@sama/repositories/blocklist_repository.js"

import Response from "@sama/networking/models/Response.js"

class UsersBlockController extends BaseJSONController {
  //TODO: add multiply block users [id1, id2..] || [id1]
  async block(ws, data) {
    const {
      id: requestId,
      block_user: { id: uId },
    } = data

    const sessionService = ServiceLocatorContainer.use("SessionService")

    const currentUserId = sessionService.getSessionUserId(ws)
    await blockListRepository.block(uId, currentUserId)

    return new Response().addBackMessage({ response: { id: requestId, success: true } })
  }

  async unblock(ws, data) {
    const {
      id: requestId,
      unblock_user: { id: uId },
    } = data

    const sessionService = ServiceLocatorContainer.use("SessionService")

    const currentUserId = sessionService.getSessionUserId(ws)
    await blockListRepository.unblock(uId, currentUserId)

    return new Response().addBackMessage({ response: { id: requestId, success: true } })
  }

  async list(ws, data) {
    const { id: requestId } = data

    const sessionService = ServiceLocatorContainer.use("SessionService")

    const currentUserId = sessionService.getSessionUserId(ws)
    const blockedUsersIds = await blockListRepository.getBlockList(currentUserId)

    return new Response().addBackMessage({
      response: {
        id: requestId,
        users: blockedUsersIds,
      },
    })
  }
}

export default new UsersBlockController()
