import assert from "node:assert"
import { Buffer } from "node:buffer"

import ServiceLocatorContainer from "../app/common/ServiceLocatorContainer.js"

import packetJsonProcessor from "../APIs/JSON/routes/packet_processor.js"
import packetManager from "../app/networking/packet_manager.js"

import { generateNewOrganizationId, createUserArray, createConversation, mockedWS, sendLogin, sendLogout } from "./tools/utils.js"

const userRepo = ServiceLocatorContainer.use("UserRepository")
const pushEventRepo = ServiceLocatorContainer.use("PushEventRepository")
const pushSubscriptionRepo = ServiceLocatorContainer.use("PushSubscriptionsRepository")

let orgId = void 0
let usersIds = []

describe("PushNotification functions", async () => {
  before(async () => {
    orgId = await generateNewOrganizationId()
    usersIds = await createUserArray(orgId, 2)

    await sendLogout(mockedWS)
    await sendLogin(mockedWS, orgId, "user_1")
  })

  describe("Create method", async () => {
    it("should work, web_endpoint ", async () => {
      const requestData = {
        request: {
          push_subscription_create: {
            platform: "web",
            web_endpoint: "enpoint_u1",
            web_key_auth: "web_key_u1",
            web_key_p256dh: "web_p256dh_u1",
            device_udid: "device_u1",
          },
          id: 1,
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.strictEqual(responseData.response.subscription.web_endpoint, requestData.request.push_subscription_create.web_endpoint)
      assert.strictEqual(responseData.response.subscription.web_key_auth, requestData.request.push_subscription_create.web_key_auth)
      assert.strictEqual(responseData.response.subscription.web_key_p256dh, requestData.request.push_subscription_create.web_key_p256dh)
      assert.strictEqual(responseData.response.subscription.device_udid, requestData.request.push_subscription_create.device_udid)
      assert.strictEqual(responseData.response.subscription.platform, requestData.request.push_subscription_create.platform)
      assert.strictEqual(responseData.response.subscription.user_id.toString(), usersIds[0].toString())
    })

    it("should work, device_token", async () => {
      const requestData = {
        request: {
          push_subscription_create: {
            platform: "web",
            device_token: "enpoint_u1",
            device_udid: "device_u1",
          },
          id: 1,
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.strictEqual(responseData.response.subscription.device_token, requestData.request.push_subscription_create.device_token)
      assert.strictEqual(responseData.response.subscription.device_udid, requestData.request.push_subscription_create.device_udid)
      assert.strictEqual(responseData.response.subscription.platform, requestData.request.push_subscription_create.platform)
      assert.strictEqual(responseData.response.subscription.user_id.toString(), usersIds[0].toString())
    })

    it("should work, update record", async () => {
      const requestData = {
        request: {
          push_subscription_create: {
            platform: "web",
            web_endpoint: "enpoint_2_u1",
            web_key_auth: "web_key_u1",
            web_key_p256dh: "web_p256dh_u1",
            device_udid: "device_u1",
          },
          id: 1,
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.strictEqual(responseData.response.subscription.web_endpoint, requestData.request.push_subscription_create.web_endpoint)
    })

    it("should fail, incorrect platform field ", async () => {
      const requestData = {
        request: {
          push_subscription_create: {
            platform: "sadasesqwe",
            web_endpoint: "enpoint_2_u1",
            web_key_auth: "web_key_u1",
            web_key_p256dh: "web_p256dh_u1",
            device_udid: "device_u1",
          },
          id: 1,
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.success, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Incorrect platform type.",
      })
    })

    it("should fail, platform missed ", async () => {
      const requestData = {
        request: {
          push_subscription_create: {
            web_endpoint: "enpoint_2_u1",
            web_key_auth: "web_key_u1",
            web_key_p256dh: "web_p256dh_u1",
            device_udid: "device_u1",
          },
          id: 1,
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.success, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Incorrect platform type.",
      })
    })

    it("should fail, endpoint missed", async () => {
      const requestData = {
        request: {
          push_subscription_create: {
            platform: "ios",
            web_key_auth: "web_key_u1",
            web_key_p256dh: "web_p256dh_u1",
            device_udid: "device_u1",
          },
          id: 1,
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.success, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Incorrect token.",
      })
    })

    it("should fail, key_auth missed", async () => {
      const requestData = {
        request: {
          push_subscription_create: {
            platform: "ios",
            web_endpoint: "enpoint_2_u1",
            web_key_p256dh: "web_p256dh_u1",
            device_udid: "device_u1",
          },
          id: 1,
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.success, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Incorrect keys.",
      })
    })

    it("should fail, key_p256dh missed", async () => {
      const requestData = {
        request: {
          push_subscription_create: {
            platform: "ios",
            web_endpoint: "enpoint_2_u1",
            web_key_auth: "web_key_u1",
            device_udid: "device_u1",
          },
          id: 1,
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.success, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Incorrect keys.",
      })
    })

    it("should fail, device_udid missed", async () => {
      const requestData = {
        request: {
          push_subscription_create: {
            platform: "ios",
            web_endpoint: "enpoint_2_u1",
            web_key_auth: "web_key_u1",
            web_key_p256dh: "web_p256dh_u1",
          },
          id: 1,
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.success, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Incorrect device id.",
      })
    })
  })

  describe("List method", async () => {
    it("should work", async () => {
      const requestData = {
        request: {
          push_subscription_list: {
            user_id: usersIds[0].toString(),
          },
          id: 1,
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.strictEqual(responseData.response.subscriptions.length, 1)
      assert.notEqual(responseData.response.subscriptions[0].platform, undefined)
      assert.notEqual(responseData.response.subscriptions[0].web_endpoint, undefined)
      assert.notEqual(responseData.response.subscriptions[0].web_key_auth, undefined)
      assert.notEqual(responseData.response.subscriptions[0].web_key_p256dh, undefined)
      assert.notEqual(responseData.response.subscriptions[0].device_udid, undefined)
      assert.notEqual(responseData.response.subscriptions[0].user_id, undefined)
    })

    it("should work, add one more record", async () => {
      let requestDataCreate = {
        request: {
          push_subscription_create: {
            platform: "ios",
            web_endpoint: "endpoin_123d",
            web_key_auth: "web_key_1",
            web_key_p256dh: "web_p256dh_2",
            device_udid: "device_2",
          },
          id: 1,
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestDataCreate))

      responseData = responseData.backMessages.at(0)

      let requestData = {
        request: {
          push_subscription_list: {
            user_id: usersIds[0].toString(),
          },
          id: 1,
        },
      }

      responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.strictEqual(responseData.response.subscriptions.length, 2)
      assert.notEqual(responseData.response.subscriptions[1].platform, requestDataCreate.request.push_subscription_create.platform)
      assert.notEqual(responseData.response.subscriptions[1].web_endpoint, requestDataCreate.request.push_subscription_create.web_endpoint)
      assert.notEqual(responseData.response.subscriptions[1].web_key_auth, requestDataCreate.request.push_subscription_create.web_key_auth)
      assert.notEqual(
        responseData.response.subscriptions[1].web_key_p256dh,
        requestDataCreate.request.push_subscription_create.web_key_p256dh
      )
      assert.notEqual(responseData.response.subscriptions[1].device_udid, requestDataCreate.request.push_subscription_create.device_udid)
      assert.notEqual(responseData.response.subscriptions[1].user_id, requestDataCreate.request.push_subscription_create.user_id)
    })

    it("should fail, user_id is missed", async () => {
      const requestData = {
        request: {
          push_subscription_list: {},
          id: 1,
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "User ID missed.",
      })
    })
  })

  describe("Delete method", async () => {
    it("should work", async () => {
      let requestData = {
        request: {
          push_subscription_delete: {
            device_udid: "device_2",
          },
          id: 1,
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.strictEqual(responseData.response.success, true)

      requestData = {
        request: {
          push_subscription_list: {
            user_id: usersIds[0].toString(),
          },
          id: 1,
        },
      }

      responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.subscriptions.length, 1)
    })

    it("should fail, notification record not found", async () => {
      let requestData = {
        request: {
          push_subscription_delete: {
            device_udid: "device_2",
          },
          id: 1,
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Push notification record not found.",
      })
    })

    it("should fail, device_udId is missed", async () => {
      let requestData = {
        request: {
          push_subscription_delete: {},
          id: 1,
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: `'device_id' is required.`,
      })
    })
  })

  describe("Create Event method", async () => {
    it("should work", async () => {
      const requestData = {
        request: {
          push_event_create: {
            recipients_ids: [usersIds[0].toString(), usersIds[1].toString()],
            message: {
              title: "Title",
              topic: "topic",
              body: "this is message",
              message: "payload",
            },
          },
          id: 1,
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      const event = responseData.response.event

      const eventMessage = Buffer.from(event.message, "base64").toString("utf8")

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.strictEqual(eventMessage, JSON.stringify(requestData.request.push_event_create.message))
      assert.strictEqual(event.user_id.toString(), usersIds[0].toString())
      assert.strictEqual(event.user_ids[0].toString(), usersIds[0].toString())
      assert.strictEqual(event.user_ids[1].toString(), usersIds[1].toString())
    })

    it("should fail, message is missed", async () => {
      const requestData = {
        request: {
          push_event_create: {
            recipients_ids: [usersIds[0].toString(), usersIds[1].toString()],
          },
          id: 1,
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Notification message missed.",
      })
    })

    it("should fail, recipients ids is missed", async () => {
      const requestData = {
        request: {
          push_event_create: {
            message: {
              title: "Title",
              topic: "topic",
              body: "this is message",
              message: "payload",
            },
          },
          id: 1,
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Incorrect recipients IDs.",
      })
    })

    it("should work, 1 recipients", async () => {
      const requestData = {
        request: {
          push_event_create: {
            recipients_ids: [usersIds[0].toString()],
            message: {
              title: "Title",
              topic: "topic",
              body: "this is message",
              message: "payload",
            },
          },
          id: 1,
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      const event = responseData.response.event

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.strictEqual(event.user_ids[0].toString(), usersIds[0].toString())
    })

    it("should fail, recipients ids not found", async () => {
      const requestData = {
        request: {
          push_event_create: {
            recipients_ids: ["testId", "teasd"],
            message: {
              title: "Title",
              topic: "topic",
              body: "this is message",
              message: "payload",
            },
          },
          id: 1,
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Recipients not found.",
      })
    })
  })

  describe("Create push message", async () => {
    let conversationId = void 0
    let responseOnMessage = void 0
    let pushQueueItem = void 0
    let messageBody = void 0

    it("create conversation", async () => {
      conversationId = await createConversation(mockedWS, void 0, void 0, "u", usersIds)
      assert.ok(conversationId)
    })


    it("send message", async () => {
      const requestData = {
        message: {
          id: `push_test_11`,
          body: "hey how is going? 1112",
          cid: conversationId,
        },
      }

      responseOnMessage = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))
      assert.ok(responseOnMessage.deliverMessages?.length > 0)

      messageBody = requestData.message.body
    })

    it("process delivers message", async () => {
      const pushQueueService = ServiceLocatorContainer.use("PushQueueService")
      const oldMethod = pushQueueService.createPushEvent
      const newMethod = async (...args) => {
        pushQueueItem = await oldMethod.apply(pushQueueService, args)
        return pushQueueItem
      }
      pushQueueService.createPushEvent = newMethod

      const deliverMessage = responseOnMessage.deliverMessages.at(0)

      await packetManager.deliverToUserOrUsers(
        deliverMessage.orgId,
        deliverMessage.ws,
        deliverMessage.packet,
        deliverMessage.pushQueueMessage,
        deliverMessage.userIds,
        deliverMessage.notSaveInOfflineStorage,
        deliverMessage.ignoreSelf
      )

      assert.ok(pushQueueItem)
    })

    it("validate push queue items", async () => {
      assert.equal(`${pushQueueItem.user_id}`, `${usersIds.at(0)}`)
      assert.equal(pushQueueItem.user_ids.length, 1)
      assert.equal(`${pushQueueItem.user_ids.at(0)}`, `${usersIds.at(1)}`)
      assert.ok(pushQueueItem.message)
      
      const messagePayload = JSON.parse(Buffer.from(pushQueueItem.message, 'base64').toString('utf8'))
      assert.equal(messagePayload.body, messageBody)
      assert.equal(messagePayload.cid, conversationId)
    })
  })

  after(async () => {
    await userRepo.deleteMany({})
    await pushEventRepo.deleteMany({})
    await pushSubscriptionRepo.deleteMany({})

    usersIds = []
  })
})
