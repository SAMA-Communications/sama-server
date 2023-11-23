import BaseServie from "./base.js";
import User from "../models/user.js";

export default class ConversationService extends BaseServie {
  async #validateNewParticipantsIds(existingParticipantsIds, newParticipants) {
    return newParticipants
      ? newParticipants
          .map((uId) => uId.toString())
          .filter((uId) => !existingParticipantsIds.includes(uId))
      : [];
  }

  async #validateRemoveParticipantsIds(
    existingParticipantsIds,
    removeParticipants
  ) {
    return removeParticipants
      ? removeParticipants
          .map((uId) => uId.toString())
          .filter((uId) => existingParticipantsIds.includes(uId))
      : [];
  }

  async getNewAndRemoveParticipantsParams(
    existingParticipantsIds,
    newParticipants,
    removeParticipants
  ) {
    const newParticipantsIds = await this.#validateNewParticipantsIds(
      existingParticipantsIds,
      newParticipants
    );

    const removeParticipantsIds = await this.#validateRemoveParticipantsIds(
      existingParticipantsIds,
      removeParticipants
    );

    const removeParticipantsInfo = [];
    const newParticipantsInfo =
      newParticipantsIds.length || removeParticipantsIds.length
        ? (
            await User.findAll(
              {
                _id: {
                  $in: [...newParticipantsIds, ...removeParticipantsIds],
                },
              },
              [
                "login",
                "first_name",
                "last_name",
                "email",
                "phone",
                "recent_activity",
              ]
            )
          ).filter((obj) => {
            if (removeParticipantsIds.includes(obj._id.toString())) {
              removeParticipantsInfo.push(obj);
              return false;
            }
            return true;
          })
        : [];

    return {
      newParticipantsIds,
      newParticipantsInfo,
      removeParticipantsIds,
      removeParticipantsInfo,
    };
  }
}
