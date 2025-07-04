import assert from "assert"

import ServiceLocatorContainer from "../app/common/ServiceLocatorContainer.js"

import packetJsonProcessor from "../APIs/JSON/routes/packet_processor.js"
import { generateNewOrganizationId, createUserArray, sendLogin, sendLogout } from "./tools/utils.js"

const sessionService = ServiceLocatorContainer.use("SessionService")
const userRepo = ServiceLocatorContainer.use("UserRepository")

let orgId = void 0
let currentUserToken = []

describe("Carbons", async () => {
  before(async () => {
    orgId = await generateNewOrganizationId()

    await createUserArray(orgId, 2)

    sessionService.activeSessions.DEVICES = {}
  })

  describe("Carbon login", async () => {
    it("should work", async () => {
      await sendLogin("ws1", orgId, "user_1", "laptop")
      await sendLogin("ws2", orgId, "user_1", "laptop")
      await sendLogin("ws3", orgId, "user_1", "laptop")

      currentUserToken = (await sendLogin("ws4", orgId, "user_1", "laptop1")).response.user._id

      await sendLogin("ws5", orgId, "user_1", "mobile")
      await sendLogin("ws6", orgId, "user_1", "laptop2")

      assert.strictEqual(sessionService.getUserDevices(currentUserToken).length, 4)
      assert.notEqual(Object.keys(sessionService.activeSessions.DEVICES).length, 0)

      await sendLogout("ws4", currentUserToken, "laptop1")

      assert.strictEqual(sessionService.getUserDevices(currentUserToken).length, 3)

      const requestData = {
        request: {
          user_delete: {},
          id: "4_1",
        },
      }

      await packetJsonProcessor.processMessageOrError("ws6", JSON.stringify(requestData))

      assert.strictEqual(Object.keys(sessionService.activeSessions.DEVICES).length, 0)
    })
  })

  after(async () => {
    await userRepo.deleteMany({})
  })
})
