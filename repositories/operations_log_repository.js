import BaseRepository from "./base.js";

class OperationsLogRepository extends BaseRepository {
  constructor(model, inMemoryStorage) {
    super(model, inMemoryStorage);
  }

  savePacket(user_id, packet) {
    const record = new OpLog({ user_id, packet });
    record.save();
  }
}

export default new OperationsLogRepository();
