class BaseStorageClient {
  constructor(options, helpers) {
    this.bucketName = options.bucketName
    this.expire = +process.env.FILE_DOWNLOAD_URL_EXPIRES_IN

    this.helpers = helpers
  }

  async getUploadUrl() {
    throw new Error("Not implemented")
  }

  async getDownloadUrl() {
    throw new Error("Not implemented")
  }
}

export default BaseStorageClient
