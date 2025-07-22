import { Client } from "minio"

import BaseStorageClient from "./base.js"

class MinioStorageClient extends BaseStorageClient {
  constructor(options, helpers) {
    options = options || { bucketName: process.env.MINIO_BUCKET_NAME }
    super(options, helpers)

    this.minioClient = new Client({
      endPoint: process.env.MINIO_ENDPOINT,
      port: +process.env.MINIO_PORT,
      useSSL: process.env.MINIO_USE_SSL == "true",
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
    })
  }

  async getUploadUrl(fileName) {
    const objectId = this.helpers.getUniqueId()

    const presignedUrl = await this.minioClient.presignedPutObject(this.bucketName, objectId, this.expire)

    return { objectId, url: presignedUrl }
  }

  async getDownloadUrl(fileId) {
    const url = await this.minioClient.presignedGetObject(this.bucketName, fileId, this.expire)

    return url
  }
}

export default MinioStorageClient
