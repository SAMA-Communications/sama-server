import BaseModel from "./base.js"

class EncryptedDevice extends BaseModel {
  static get collection() {
    return "encrypted_devices"
  }

  static get visibleFields() {
    return ["_id", "user_id", "identity_key", "signed_key", "one_time_pre_keys"]
  }
}

export default EncryptedDevice
