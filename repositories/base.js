export default class BaseRepository {
  constructor(model, inMemoryStorage) {
    this.model = model;
    this.inMemoryStorage = inMemoryStorage;
  }

  findAll(...args) {}

  findById(id) {
    return this.model.findByPk(id);
  }
}
