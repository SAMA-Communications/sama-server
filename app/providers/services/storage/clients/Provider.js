import config from "../../../../config/index.js"

import MinioStorageClient from "./minio.js"
import S3StorageClient from "./s3.js"
import SpacerStorageClient from "./spaces.js"

import RegisterProvider from "../../../../common/RegisterProvider.js"

const name = "StorageDriverClient"
const storageDriverName = config.get("storage.driver")

const StorageDriverClient =
  storageDriverName === "minio" ? MinioStorageClient : storageDriverName === "spacer" ? SpacerStorageClient : S3StorageClient

class StorageDriverClientRegisterProvider extends RegisterProvider {
  register(slc) {
    const config = slc.use("Config")
    const helpers = slc.use("Helpers")

    return new StorageDriverClient(config, helpers)
  }
}

export default new StorageDriverClientRegisterProvider({
  name,
  implementationName: StorageDriverClient.name,
})
