import BaseModel from "./base.js"

class EncryptedDevice extends BaseModel {
  static get collection() {
    return "encrypted_devices"
  }

  static get visibleFields() {
    return ["_id", "identity_key", "signed_key", "one_time_pre_keys", "device_id"]
  }
}

export default EncryptedDevice
