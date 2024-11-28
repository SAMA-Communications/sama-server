import assert from "assert"

import ServiceLocatorContainer from "../app/common/ServiceLocatorContainer.js"

import { createUserArray, mockedWS, sendLogin, sendLogout } from "./utils.js"

import packetJsonProcessor from "../APIs/JSON/routes/packet_processor.js"

const userRepo = ServiceLocatorContainer.use("UserRepository")
const encryptionRepo = ServiceLocatorContainer.use("EncryptionRepository")

let currentUserToken = ""
let usersIds = []
let userDeviceId = null

describe("Encryption function", async () => {
  before(async () => {
    usersIds = await createUserArray(3)

    currentUserToken = (await sendLogin(mockedWS, "user_1", "device_1")).response.user._id
  })

  describe("Device Registration", async () => {
    it("should fail, identity key is missing", async () => {
      const requestData = {
        device_register: {
          signed_key: "test_key",
          one_time_pre_keys: ["test_key"],
        },
      }
      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))
      responseData = responseData.backMessages.at(0).device_register

      assert.notEqual(responseData, undefined)
      assert.deepEqual(responseData.error, {
        status: 422,
        message: `Incorrect identity device key.`,
      })
    })

    it("should fail, signed key is missing", async () => {
      const requestData = {
        device_register: {
          identity_key: "test_key",
          one_time_pre_keys: ["test_key"],
        },
      }
      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))
      responseData = responseData.backMessages.at(0).device_register

      assert.notEqual(responseData, undefined)
      assert.deepEqual(responseData.error, {
        status: 422,
        message: `Incorrect signed key.`,
      })
    })

    it("should fail, one time pre key is missing", async () => {
      const requestData = {
        device_register: {
          identity_key: "test_key",
          signed_key: "test_key",
        },
      }
      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))
      responseData = responseData.backMessages.at(0).device_register

      assert.notEqual(responseData, undefined)
      assert.deepEqual(responseData.error, {
        status: 422,
        message: `Incorrect one time pre keys.`,
      })
    })

    it("should fail, incorrect one time pre keys", async () => {
      const requestData = {
        device_register: {
          identity_key: "test_key",
          signed_key: "test_key",
          one_time_pre_keys: [{}],
        },
      }
      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))
      responseData = responseData.backMessages.at(0).device_register

      assert.notEqual(responseData, undefined)
      assert.deepEqual(responseData.error, {
        status: 422,
        message: `Incorrect one time pre keys.`,
      })
    })

    it("should work", async () => {
      const requestData = {
        device_register: {
          identity_key: "test_key",
          signed_key: "test_key",
          one_time_pre_keys: ["test_key"],
        },
        id: "1",
      }
      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))
      responseData = responseData.backMessages.at(0).response

      assert.equal(responseData.success, true)
      assert.equal(responseData.id, requestData.id)
      assert.deepEqual(responseData.error, undefined)
    })

    it("should work, update device record", async () => {
      const requestData = {
        device_register: {
          identity_key: "test_key",
          signed_key: "test_key-1",
          one_time_pre_keys: ["test_key", "test_key1", "test_key2"],
        },
        id: "2",
      }
      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))
      responseData = responseData.backMessages.at(0).response

      assert.equal(responseData.success, true)
      assert.equal(responseData.id, requestData.id)
      assert.deepEqual(responseData.error, undefined)
    })
  })

  describe("Device List", async () => {
    it("should work, myself", async () => {
      const requestData = {
        device_list: {},
        id: "1",
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))
      responseData = responseData.backMessages.at(0).response

      userDeviceId = responseData.devices[0].device_id

      assert.equal(responseData.id, requestData.id)
      assert.equal(responseData.devices[0].signed_key, "test_key-1")
      assert.equal(responseData.devices[0].identity_key, "test_key")
      assert.notEqual(responseData.devices[0].device_id, null)
      assert.equal(responseData.devices[0].one_time_pre_keys, null)
    })

    it("should work, by id", async () => {
      currentUserToken = (await sendLogin(mockedWS, "user_2")).response.user.token

      const requestData = {
        request_keys: {
          user_ids: [usersIds[0]],
        },
        id: "1",
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))
      responseData = responseData.backMessages.at(0).response
      responseData = responseData.devices[usersIds[0]][0]

      assert.equal(responseData.signed_key, "test_key-1")
      assert.equal(responseData.identity_key, "test_key")
      assert.equal(responseData.one_time_pre_keys.length, 1)
      assert.equal(responseData.one_time_pre_keys, "test_key")
    })

    it("should work, by id again", async () => {
      const requestData = {
        request_keys: {
          user_ids: [usersIds[0]],
        },
        id: "1",
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))
      responseData = responseData.backMessages.at(0).response
      responseData = responseData.devices[usersIds[0]][0]

      assert.equal(responseData.signed_key, "test_key-1")
      assert.equal(responseData.identity_key, "test_key")
      assert.equal(responseData.one_time_pre_keys.length, 1)
      assert.equal(responseData.one_time_pre_keys, "test_key1")
    })
  })

  describe("Device Delete", async () => {
    it("should fail, forbidden", async () => {
      const requestData = {
        device_delete: {
          device_id: "user_19673",
        },
        id: "1",
      }
      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))
      responseData = responseData.backMessages.at(0).device_delete

      assert.notEqual(responseData, undefined)
      assert.deepEqual(responseData.error, { status: 403, message: "Forbidden." })
    })

    it("should fail, no record by device_id", async () => {
      await sendLogout(mockedWS, currentUserToken)
      currentUserToken = (await sendLogin(mockedWS, "user_1")).response.user.token

      const requestData = {
        device_delete: {
          device_id: "312dfsszfg",
        },
        id: "1",
      }
      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))
      responseData = responseData.backMessages.at(0).device_delete

      assert.notEqual(responseData, undefined)
      assert.deepEqual(responseData.error, { status: 403, message: "Forbidden." })
    })

    it("should fail, forbidden", async () => {
      await sendLogout(mockedWS, currentUserToken)
      currentUserToken = (await sendLogin(mockedWS, "user_2")).response.user.token

      const requestData = {
        device_delete: {
          device_id: userDeviceId,
        },
        id: "2",
      }
      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))
      responseData = responseData.backMessages.at(0).device_delete

      assert.notEqual(responseData, undefined)
      assert.deepEqual(responseData.error, { status: 403, message: "Forbidden." })
    })
  })

  after(async () => {
    await userRepo.deleteMany({})
    await encryptionRepo.deleteMany({})

    usersIds = []
  })
})
