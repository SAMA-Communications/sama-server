import BaseServie from "./base.js";
import User from "../models/user.js";

export default class ConversationService extends BaseServie {
  async getNewAndRemoveParticipantsParams(
    existingParticipantsIds,
    newParticipants,
    removeparticipants
  ) {
    const newParticipantsIds = newParticipants
      ? newParticipants
          .map((uId) => uId.toString())
          .filter((uId) => !existingParticipantsIds.includes(uId))
      : [];

    const removeParticipantsIds = removeparticipants
      ? removeparticipants
          .map((uId) => uId.toString())
          .filter((uId) => existingParticipantsIds.includes(uId))
      : [];

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
