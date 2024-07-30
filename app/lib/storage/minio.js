import { Client } from "minio"

import BaseStorage from "./base.js"

import getUniqueId from "../../utils/uuid.js"

export default class Minio extends BaseStorage {
  constructor(options) {
    options = options || { bucketName: process.env.MINIO_BUCKET_NAME }
    super(options)

    this.minioClient = new Client({
      endPoint: process.env.MINIO_ENDPOINT,
      port: +process.env.MINIO_PORT,
      useSSL: process.env.MINIO_USE_SSL == "true",
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
    })
  }

  async getUploadUrl(fileName) {
    const objectId = getUniqueId()

    const presignedUrl = await this.minioClient.presignedPutObject(this.bucketName, objectId, this.expire)

    return { objectId, url: presignedUrl }
  }

  async getDownloadUrl(fileId) {
    return await this.minioClient.presignedGetObject(this.bucketName, fileId, this.expire)
  }
}
