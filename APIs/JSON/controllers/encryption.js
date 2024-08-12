import BaseJSONController from "./base.js"

import ServiceLocatorContainer from "@sama/common/ServiceLocatorContainer.js"

import Response from "@sama/networking/models/Response.js"

class EncryptionController extends BaseJSONController {
  async register(ws, data) {
    const { id: requestId, device_register: userKeys } = data

    const encryptionRegisterOperation = ServiceLocatorContainer.use("EncryptionRegisterOperation")
    await encryptionRegisterOperation.perform(userKeys)

    return new Response().addBackMessage({ response: { id: requestId, success: true } })
  }

  list(ws, data) {}

  delete(ws, data) {}
}

export default new EncryptionController()
