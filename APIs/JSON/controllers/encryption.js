import BaseJSONController from "./base.js"

import ServiceLocatorContainer from "@sama/common/ServiceLocatorContainer.js"

import Response from "@sama/networking/models/Response.js"

class EncryptionController extends BaseJSONController {
  async register(ws, data) {
    const { id: requestId } = data

    const encryptionRegisterOperation = ServiceLocatorContainer.use("EncryptionRegisterOperation")
    await encryptionRegisterOperation.perform(ws, data.device_register)

    return new Response().addBackMessage({ response: { id: requestId, success: true } })
  }

  async list(ws, data) {
    const { id: requestId } = data

    const encryptionListOperation = ServiceLocatorContainer.use("EncryptionListOperation")
    const deviceList = await encryptionListOperation.perform(ws)

    return new Response().addBackMessage({ response: { id: requestId, devices: deviceList } })
  }

  async request_keys(ws, data) {
    const { id: requestId } = data

    const encryptionRequestKeysOperation = ServiceLocatorContainer.use("EncryptionRequestKeysOperation")
    const deviceList = await encryptionRequestKeysOperation.perform(ws, data.request_keys)

    return new Response().addBackMessage({ response: { id: requestId, devices: deviceList } })
  }

  async delete(ws, data) {
    const { id: requestId } = data

    const encryptionDeleteOperation = ServiceLocatorContainer.use("EncryptionDeleteOperation")
    await encryptionDeleteOperation.perform(ws, data.device_delete)

    return new Response().addBackMessage({ response: { id: requestId, success: true } })
  }
}

export default new EncryptionController()
