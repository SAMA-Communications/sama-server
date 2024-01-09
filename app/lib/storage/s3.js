import { PutObjectCommand, S3, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

import BaseStorage from './base.js'

import getUniqueId from '../../utils/uuid.js'

export default class S3Storage extends BaseStorage {
  constructor(params) {
    super(params)
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
    try {
      const bucketParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: objectId,
      }
      const presignedUrl = await getSignedUrl(
        this.s3Client,
        new PutObjectCommand(bucketParams),
        { expiresIn: process.env.FILE_UPLOAD_URL_EXPIRES_IN }
      )
      return { objectId, url: presignedUrl }
    } catch (err) {
      console.log(err)
      return err
    }
  }

  async getDownloadUrl(fileId) {
    try {
      const bucketParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileId,
      }
      return await getSignedUrl(
        this.s3Client,
        new GetObjectCommand(bucketParams),
        { expiresIn: process.env.FILE_DOWNLOAD_URL_EXPIRES_IN }
      )
    } catch (err) {
      return err
    }
  }
}
