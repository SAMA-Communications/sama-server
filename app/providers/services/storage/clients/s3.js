import { PutObjectCommand, S3, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

import BaseStorageClient from "./base.js"

class S3StorageClient extends BaseStorageClient {
  constructor(config, helpers) {
    super(config, helpers)

    this.s3Client = new S3({
      credentials: {
        accessKeyId: this.config.get("storage.s3.key"),
        secretAccessKey: this.config.get("storage.s3.secret"),
      },
      endpoint: this.config.get("storage.s3.endpoint"),
      region: this.config.get("storage.s3.region"),
    })

    this.bucketName = this.config.get("storage.s3.bucket")
  }

  async getUploadUrl(fileName) {
    const objectId = this.helpers.getUniqueId()

    const bucketParams = {
      Bucket: this.bucketName,
      Key: objectId,
    }

    const presignedUrl = await getSignedUrl(this.s3Client, new PutObjectCommand(bucketParams), {
      expiresIn: this.expireUploadUrl,
    })

    return { objectId, url: presignedUrl }
  }

  async getDownloadUrl(fileId) {
    const bucketParams = {
      Bucket: this.bucketName,
      Key: fileId,
    }

    const url = await getSignedUrl(this.s3Client, new GetObjectCommand(bucketParams), { expiresIn: this.expireDownloadUrl })

    return url
  }
}

export default S3StorageClient
