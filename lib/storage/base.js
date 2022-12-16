export default class BaseStorage {
  async getUploadUrl() {
    throw "Not implemented";
  }
  async getDownloadUrl() {
    throw "Not implemented";
  }
}
