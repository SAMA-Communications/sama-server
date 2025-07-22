import MinioStorageClient from "./minio.js"
import S3StorageClient from "./s3.js"
import SpacerStorageClient from "./spaces.js"

import RegisterProvider from "../../../../common/RegisterProvider.js"

const name = "StorageDriverClient"
const StorageDriverClient =
  process.env.STORAGE_DRIVER === "minio"
    ? MinioStorageClient
    : process.env.STORAGE_DRIVER === "spacer"
      ? SpacerStorageClient
      : S3StorageClient

class StorageDriverClientRegisterProvider extends RegisterProvider {
  register(slc) {
    const options = void 0
    const helpers = slc.use("Helpers")

    return new StorageDriverClient(options, helpers)
  }
}

export default new StorageDriverClientRegisterProvider({
  name,
  implementationName: StorageDriverClient.name,
})
