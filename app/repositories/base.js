export default class BaseRepository {
  constructor(model, inMemoryStorage) {
    this.model = model
    this.inMemoryStorage = inMemoryStorage
  }

  async warmCache() {
    throw new Error('Not implemented')
  }
}
