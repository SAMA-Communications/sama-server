import BaseJSONController from "./base.js"

import ServiceLocatorContainer from "@sama/common/ServiceLocatorContainer.js"

import Response from "@sama/networking/models/Response.js"

class EncryptionController extends BaseJSONController {
  async register(ws, data) {
    const { id: requestId, device_register: userKeys } = data

    const encryptionRegisterOperation = ServiceLocatorContainer.use("EncryptionRegisterOperation")
    await encryptionRegisterOperation.perform(ws, userKeys)

    return new Response().addBackMessage({ response: { id: requestId, success: true } })
  }

  async list(ws, data) {
    const { id: requestId, device_list: deviceListParams } = data

    // const encryptionRegisterOperation = ServiceLocatorContainer.use("EncryptionRegisterOperation")
    // await encryptionRegisterOperation.perform(userKeys)

    // [id, id, id]
    // []
    return new Response().addBackMessage({ response: { id: requestId, devices: true } })
  }

  async delete(ws, data) {
    const { id: requestId, device_delete: deleteParams } = data

    const encryptionDeleteOperation = ServiceLocatorContainer.use("EncryptionDeleteOperation")
    await encryptionDeleteOperation.perform(ws, deleteParams)

    return new Response().addBackMessage({ response: { id: requestId, success: true } })
  }
}

export default new EncryptionController()
