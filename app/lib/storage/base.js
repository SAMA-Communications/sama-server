export default class BaseStorage {
  constructor(options) {
    this.bucketName = options.bucketName
    this.expire = +process.env.FILE_DOWNLOAD_URL_EXPIRES_IN
  }

  async getUploadUrl() {
    throw new Error('Not implemented')
  }

  async getDownloadUrl() {
    throw new Error('Not implemented')
  }
}
