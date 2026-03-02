import { Client } from "minio"

import BaseStorageClient from "./base.js"

class MinioStorageClient extends BaseStorageClient {
  constructor(config, helpers) {
    super(config, helpers)

    this.minioClient = new Client({
      accessKey: this.config.get("storage.minio.key"),
      secretKey: this.config.get("storage.minio.secret"),
      endPoint: this.config.get("storage.minio.endpoint"),
      port: +this.config.get("storage.minio.port"),
      useSSL: this.config.get("storage.minio.useSSL"),
    })

    this.bucketName = this.config.get("storage.minio.bucket")
  }

  async getUploadUrl(fileName) {
    const objectId = this.helpers.getUniqueId()

    const presignedUrl = await this.minioClient.presignedPutObject(this.bucketName, objectId, this.expireUploadUrl)

    return { objectId, url: presignedUrl }
  }

  async getDownloadUrl(fileId) {
    const url = await this.minioClient.presignedGetObject(this.bucketName, fileId, this.expireDownloadUrl)

    return url
  }
}

export default MinioStorageClient
