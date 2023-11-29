import BaseServie from "./base.js";
import User from "../models/user.js";

export default class ConversationService extends BaseServie {
  async #validateAndReturnParticipantsIdsToAdd(
    existingParticipantsIds,
    newParticipants
  ) {
    return newParticipants
      ? newParticipants
          .map((uId) => uId.toString())
          .filter((uId) => !existingParticipantsIds.includes(uId))
      : [];
  }

  async #validateAndReturnParticipantsIdsToRemove(
    existingParticipantsIds,
    removeParticipants
  ) {
    return removeParticipants
      ? removeParticipants
          .map((uId) => uId.toString())
          .filter((uId) => existingParticipantsIds.includes(uId))
      : [];
  }

  async #getParticipantsInfo(participantsIds) {
    return participantsIds.length
      ? await User.findAll({ _id: { $in: participantsIds } }, [
          "login",
          "first_name",
          "last_name",
          "email",
          "phone",
          "recent_activity",
        ])
      : [];
  }

  async getNewParticipantsParams(existingParticipantsIds, newParticipants) {
    const newParticipantsIds =
      await this.#validateAndReturnParticipantsIdsToAdd(
        existingParticipantsIds,
        newParticipants
      );

    const newParticipantsInfo = await this.#getParticipantsInfo(
      newParticipantsIds
    );

    return { newParticipantsIds, newParticipantsInfo };
  }

  async getRemoveParticipantsParams(
    existingParticipantsIds,
    removeParticipants
  ) {
    const removeParticipantsIds =
      await this.#validateAndReturnParticipantsIdsToRemove(
        existingParticipantsIds,
        removeParticipants
      );

    const removeParticipantsInfo = await this.#getParticipantsInfo(
      removeParticipantsIds
    );

    return { removeParticipantsIds, removeParticipantsInfo };
  }
}