class BaseStorageClient {
  constructor(config, helpers) {
    this.config = config
    this.helpers = helpers

    this.expireUploadUrl = +config.get("storage.uploadUrlExpiresIn")
    this.expireDownloadUrl = +config.get("storage.downloadUrlExpiresIn")

    this.bucketName = void 0
  }

  async getUploadUrl() {
    throw new Error("Not implemented")
  }

  async getDownloadUrl() {
    throw new Error("Not implemented")
  }
}

export default BaseStorageClient
