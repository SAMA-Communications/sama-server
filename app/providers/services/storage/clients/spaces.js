import { S3 } from "@aws-sdk/client-s3"

import S3StorageClient from "./s3.js"

class SpacesStorageClient extends S3StorageClient {
  constructor(config, helpers) {
    super(config, helpers)

    this.s3Client = new S3({
      credentials: {
        accessKeyId: this.config.get("storage.spaces.key"),
        secretAccessKey: this.config.get("storage.spaces.secret"),
      },
      endpoint: this.config.get("storage.spaces.endpoint"),
      region: this.config.get("storage.spaces.region"),
    })

    this.bucketName = this.config.get("storage.spaces.bucket")
  }
}

export default SpacesStorageClient
