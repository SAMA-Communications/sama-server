import assert from "assert"

import ServiceLocatorContainer from "../app/common/ServiceLocatorContainer.js"

import { generateNewOrganizationId, createUserArray, mockedWS, sendLogin } from "./tools/utils.js"
import packetJsonProcessor from "../APIs/JSON/routes/packet_processor.js"

const userRepo = ServiceLocatorContainer.use("UserRepository")
const opLogsService = ServiceLocatorContainer.use("OperationLogsService")
const opLogRepository = ServiceLocatorContainer.use("OperationsLogRepository")

let orgId = void 0
let timeWhenUserOff = null
let usersIds = []

describe("Operations Log functions", async () => {
  before(async () => {
    orgId = await generateNewOrganizationId()

    await opLogRepository.deleteMany({})
    usersIds = await createUserArray(orgId, 2)

    await sendLogin(mockedWS, orgId, "user_1")

    for (let i = 0; i < 2; i++) {
      await opLogsService.savePacket(
        usersIds[1],
        JSON.stringify({
          message_update: {
            id: `mid${i}`,
            body: `body${i}`,
          },
        })
      )
    }
  })

  describe("Get record from OpLog", async () => {
    it("should fail", async () => {
      await sendLogin(mockedWS, orgId, "user_2")

      const requestData = {
        request: {
          op_log_list: {
            created_at: {
              lt: null,
            },
          },
          id: "lt_sample",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.equal(responseData.response.logs, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Gt or lt query missed.",
      })
    })

    it("should work lt param", async () => {
      timeWhenUserOff = new Date()
      const requestData = {
        request: {
          op_log_list: {
            created_at: {
              lt: timeWhenUserOff,
            },
          },
          id: "lt_sample",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0).packet

      for (let i = 2; i < 6; i++) {
        await opLogsService.savePacket(
          usersIds[1],
          JSON.stringify({
            message_update: {
              id: `mid${i}`,
              body: `body${i}`,
            },
          })
        )
      }

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.equal(responseData.response.logs.length, 2)
    })

    it("should work gt param", async () => {
      await sendLogin(mockedWS, orgId, "user_2")

      const requestData = {
        request: {
          op_log_list: {
            created_at: {
              gt: timeWhenUserOff,
            },
          },
          id: "gt_sample",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0).packet

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.equal(responseData.response.logs.length, 4)
    })
  })

  after(async () => {
    await userRepo.deleteMany({})
    await opLogRepository.deleteMany({})

    usersIds = []
  })
})
