export default class BaseRepository {
  constructor(model, inMemoryStorage) {
    this.model = model;
    this.inMemoryStorage = inMemoryStorage;
  }

  warmCache() {
    throw "not implemented";
  }
}
