import RegisterProvider from "../../../../common/RegisterProvider.js"
import BaseMapper from "./index.js"

const name = "BaseMapper"

class BaseMapperRegisterProvider extends RegisterProvider {
  register(slc) {
    return new BaseMapper()
  }
}

export default new BaseMapperRegisterProvider({ name, implementationName: BaseMapper.name })
