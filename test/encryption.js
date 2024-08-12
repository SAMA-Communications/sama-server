import assert from "assert"

import ServiceLocatorContainer from "../app/common/ServiceLocatorContainer.js"

import { createUserArray, mockedWS, sendLogin, sendLogout } from "./utils.js"

import packetJsonProcessor from "../APIs/JSON/routes/packet_processor.js"

const userRepo = ServiceLocatorContainer.use("UserRepository")
const encryptionRepo = ServiceLocatorContainer.use("EncryptionRepository")

let currentUserToken = ""
let usersIds = []

describe("Encryption function", async () => {
  before(async () => {
    usersIds = await createUserArray(3)

    currentUserToken = (await sendLogin(mockedWS, "user_1")).response.user._id
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
          one_time_pre_keys: ["test_key"],
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

  describe("Device Delete", async () => {
    it("should work", async () => {
      const requestData = {
        device_delete: {
          key: "test_key",
        },
        id: "1",
      }
      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))
      responseData = responseData.backMessages.at(0).response

      assert.equal(responseData.success, true)
      assert.equal(responseData.id, requestData.id)
      assert.deepEqual(responseData.error, undefined)
    })
  })

  after(async () => {
    await userRepo.deleteMany({})
    await encryptionRepo.deleteMany({})

    usersIds = []
  })
})
