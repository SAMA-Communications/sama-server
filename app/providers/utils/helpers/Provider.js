import RegisterProvider from "../../../common/RegisterProvider.js"
import Helpers from "./index.js"

const name = "Helpers"

class HelpersRegisterProvider extends RegisterProvider {
  register(slc) {
    return new Helpers()
  }
}

export default new HelpersRegisterProvider({ name, implementationName: Helpers.name })
