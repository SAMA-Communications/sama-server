import { S3 } from '@aws-sdk/client-s3'

import S3Storage from './s3.js'

export default class Spaces extends S3Storage {
  constructor(params) {
    super(params)
    this.s3Client = new S3({
      endpoint: process.env.SPACES_ENDPOINT || null,
      region: process.env.SPACES_REGION,
      credentials: {
        accessKeyId: process.env.SPACES_ACCESS_KEY,
        secretAccessKey: process.env.SPACES_SECRET_KEY,
      },
    })
  }
}
