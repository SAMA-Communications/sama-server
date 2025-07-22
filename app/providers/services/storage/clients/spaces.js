import { S3 } from "@aws-sdk/client-s3"

import S3StorageClient from "./s3.js"

class SpacesStorageClient extends S3StorageClient {
  constructor(options, helpers) {
    options = options || { bucketName: process.env.SPACES_BUCKET_NAME }
    super(options, helpers)

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

export default SpacesStorageClient
