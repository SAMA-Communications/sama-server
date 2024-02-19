import BaseService from '@sama/services/base.js'

import ServiceLocatorContainer from '@sama/common/ServiceLocatorContainer.js'

class ConversationService extends BaseService {
  async #validateAndReturnParticipantsIdsToAdd(
    existingParticipantsIds,
    newParticipants
  ) {
    return newParticipants
      ? newParticipants
          .map((uId) => uId.toString())
          .filter((uId) => !existingParticipantsIds.includes(uId))
      : []
  }

  async #validateAndReturnParticipantsIdsToRemove(
    existingParticipantsIds,
    removeParticipants
  ) {
    return removeParticipants
      ? removeParticipants
          .map((uId) => uId.toString())
          .filter((uId) => existingParticipantsIds.includes(uId))
      : []
  }

  async #getParticipantsInfo(participantsIds) {
    if (participantsIds.length) {
      const userService = ServiceLocatorContainer.use('UserService')
      const users = await userService.userRepo.findAllByIds(participantsIds)
      return users.map(user => user.params)
    }

    return []
  }

  async getNewParticipantsParams(existingParticipantsIds, newParticipants) {
    const newParticipantsIds =
      await this.#validateAndReturnParticipantsIdsToAdd(
        existingParticipantsIds,
        newParticipants
      )

    const newParticipantsInfo = await this.#getParticipantsInfo(
      newParticipantsIds
    )

    return { newParticipantsIds, newParticipantsInfo }
  }

  async getRemoveParticipantsParams(
    existingParticipantsIds,
    removeParticipants
  ) {
    const removeParticipantsIds =
      await this.#validateAndReturnParticipantsIdsToRemove(
        existingParticipantsIds,
        removeParticipants
      )

    const removeParticipantsInfo = await this.#getParticipantsInfo(
      removeParticipantsIds
    )

    return { removeParticipantsIds, removeParticipantsInfo }
  }
}

export default new ConversationService()