class OperationsLogRepository {
  constructor() {}

  savePacket(user_id, packet) {
    const record = new OpLog({ user_id, packet });
    record.save();
  }
}

export default new OperationsLogRepository();
