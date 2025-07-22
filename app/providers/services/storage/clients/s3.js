import { PutObjectCommand, S3, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

import BaseStorageClient from "./base.js"

class S3StorageClient extends BaseStorageClient {
  constructor(options, helpers) {
    options = options || { bucketName: process.env.S3_BUCKET_NAME }
    super(options, helpers)

    this.s3Client = new S3({
      endpoint: process.env.S3_ENDPOINT || null,
      region: process.env.S3_REGION,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
      },
    })
  }

  async getUploadUrl(fileName) {
    const objectId = this.helpers.getUniqueId()

    const bucketParams = {
      Bucket: this.bucketName,
      Key: objectId,
    }

    const presignedUrl = await getSignedUrl(this.s3Client, new PutObjectCommand(bucketParams), {
      expiresIn: this.expire,
    })

    return { objectId, url: presignedUrl }
  }

  async getDownloadUrl(fileId) {
    const bucketParams = {
      Bucket: this.bucketName,
      Key: fileId,
    }

    const url = await getSignedUrl(this.s3Client, new GetObjectCommand(bucketParams), { expiresIn: this.expire })

    return url
  }
}

export default S3StorageClient
