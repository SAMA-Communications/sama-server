import BaseJSONController from './base.js'

import ServiceLocatorContainer from '@sama/common/ServiceLocatorContainer.js'

import Response from '@sama/networking/models/Response.js'

class UsersBlockController extends BaseJSONController {
  async block(ws, data) {
    const { id: requestId, block_user: blockParams } = data

    const blockListBlockOperation = ServiceLocatorContainer.use('BlockListBlockOperation')

    await blockListBlockOperation.perform(ws, blockParams)

    return new Response().addBackMessage({ response: { id: requestId, success: true } })
  }

  async unblock(ws, data) {
    const { id: requestId, unblock_user: { id: uId, ids: uIds } } = data

    const blockListUnblockOperation = ServiceLocatorContainer.use('BlockListUnblockOperation')

    await blockListUnblockOperation.perform(ws, uIds ?? uId)

    return new Response().addBackMessage({ response: { id: requestId, success: true } })
  }

  async enable(ws, data) {
    const { id: requestId, block_list_enable: { enable } } = data

    const blockListEnableOperation = ServiceLocatorContainer.use('BlockListEnableOperation')

    await blockListEnableOperation.perform(ws, enable)

    return new Response().addBackMessage({ response: { id: requestId, success: true } })
  }

  async list(ws, data) {
    const { id: requestId } = data

    const blockListRetrieveOperation = ServiceLocatorContainer.use('BlockListRetrieveOperation')

    const blockedUsersIds = await blockListRetrieveOperation.perform(ws)

    return new Response().addBackMessage({
      response: {
        id: requestId,
        users: blockedUsersIds,
      },
    })
  }
}

export default new UsersBlockController()
