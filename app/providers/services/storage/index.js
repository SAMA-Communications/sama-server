class StorageService {
  constructor(redisConnection, storageDriverClient, fileRepo) {
    this.redisConnection = redisConnection
    this.storageDriverClient = storageDriverClient
    this.fileRepo = fileRepo
  }

  async createFile(userId, fileObj) {
    const { objectId, url } = await this.storageDriverClient.getUploadUrl(fileObj.name)

    fileObj.object_id = objectId

    const fileModel = await this.fileRepo.create(userId, fileObj)

    return { file: fileModel.visibleParams(), upload_url: url }
  }

  async getFileDownloadUrl(userId, fileObjectId) {
    const file = await this.fileRepo.findUserFile(userId, fileObjectId)

    if (!file) {
      throw new Error(`Can't find file`)
    }

    const existedDownloadUrl = await this.#getFileUrl(fileObjectId)

    if (existedDownloadUrl) {
      return existedDownloadUrl
    }

    const downloadUrl = await this.storageDriverClient.getDownloadUrl(fileObjectId)

    await this.#storeFileUrl(fileObjectId, downloadUrl)

    return downloadUrl
  }

  #generateKey(fileObjectId) {
    return `file:${fileObjectId}`
  }

  async #getFileUrl(fileObjectId) {
    const fileKey = this.#generateKey(fileObjectId)
    const items = await this.redisConnection.client.sMembers(fileKey)
    return items.at(0)
  }

  async #storeFileUrl(fileObjectId, url) {
    const fileKey = this.#generateKey(fileObjectId)
    await this.redisConnection.client.sAdd(fileKey, url)
    await this.redisConnection.client.expire(fileKey, 3600)
  }
}

export default StorageService
