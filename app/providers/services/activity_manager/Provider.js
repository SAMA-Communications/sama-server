import RegisterProvider from "../../../common/RegisterProvider.js"

const name = "ActivityManagerService"

class ActivityManagerServiceRegisterProvider extends RegisterProvider {
  register(slc) {
    const config = slc.use("Config")

    return config.get("app.isStandAloneNode") ? slc.use("ActivityManagerStandaloneService") : slc.use("ActivityManagerClusterService")
  }
}

export default new ActivityManagerServiceRegisterProvider({ name, implementationName: name })
