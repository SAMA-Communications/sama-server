import RegisterProvider from "../../../../common/RegisterProvider.js"
import FileCreateOperation from "./index.js"

const name = "FileCreateOperation"

class FileCreateOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const storageService = slc.use("StorageService")

    return new FileCreateOperation(sessionService, storageService)
  }
}

export default new FileCreateOperationRegisterProvider({
  name,
  implementationName: FileCreateOperation.name,
  scope: RegisterProvider.SCOPE.TRANSIENT,
})
