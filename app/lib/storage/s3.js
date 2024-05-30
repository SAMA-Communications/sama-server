import { PutObjectCommand, S3, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

import BaseStorage from "./base.js"

import getUniqueId from "../../utils/uuid.js"

export default class S3Storage extends BaseStorage {
  constructor(options) {
    options = options || { bucketName: process.env.S3_BUCKET_NAME }
    super(options)

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
    const objectId = getUniqueId(fileName)

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

    return await getSignedUrl(this.s3Client, new GetObjectCommand(bucketParams), { expiresIn: this.expire })
  }
}
