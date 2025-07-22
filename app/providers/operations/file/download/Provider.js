import RegisterProvider from "../../../../common/RegisterProvider.js"
import FileDownloadOperation from "./index.js"

const name = "FileDownloadOperation"

class FileDownloadOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const storageService = slc.use("StorageService")

    return new FileDownloadOperation(sessionService, storageService)
  }
}

export default new FileDownloadOperationRegisterProvider({
  name,
  implementationName: FileDownloadOperation.name,
  scope: RegisterProvider.SCOPE.TRANSIENT,
})
