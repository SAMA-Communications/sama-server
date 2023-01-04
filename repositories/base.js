export default class BaseRepository {
  constructor(model, inMemoryStorage) {
    this.model = model;
    this.inMemoryStorage = inMemoryStorage;
  }

  async create(...args) {}

  upsert(...args) {}

  bulkCreate(data, params) {}

  bulkDelete(data, params) {}

  findOne(...args) {}

  findAll(...args) {}

  findById(id) {
    return this.model.findByPk(id);
  }

  update(...args) {
    return this.model.update(...args);
  }

  remove(...args) {}

  async updateById(id, update) {}
}
