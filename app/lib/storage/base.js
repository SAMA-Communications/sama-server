export default class BaseStorage {
  async getUploadUrl() {
    throw new Error('Not implemented')
  }

  async getDownloadUrl() {
    throw new Error('Not implemented')
  }
}
