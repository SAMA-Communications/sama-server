import assert from "assert";

import User from "./../app/models/user.js";
import { connectToDBPromise } from "./../app/lib/db.js";

import PushEvent from "./../app/models/push_event.js";
import PushSubscription from "./../app/models/push_subscription.js";
import packetJsonProcessor from "../APIs/JSON/routes/packet_processor.js";

import { createUserArray, mockedWS, sendLogin } from "./utils.js";

let usersIds = [];

describe("PushNotification functions", async () => {
  before(async () => {
    await connectToDBPromise();
    usersIds = await createUserArray(2);
    await sendLogin(mockedWS, "user_1");
  });

  describe("Create method", async () => {
    it("should work", async () => {
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
      };

      let responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      );

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.strictEqual(
        responseData.response.subscription.web_endpoint,
        requestData.request.push_subscription_create.web_endpoint
      );
      assert.strictEqual(
        responseData.response.subscription.web_key_auth,
        requestData.request.push_subscription_create.web_key_auth
      );
      assert.strictEqual(
        responseData.response.subscription.web_key_p256dh,
        requestData.request.push_subscription_create.web_key_p256dh
      );
      assert.strictEqual(
        responseData.response.subscription.device_udid,
        requestData.request.push_subscription_create.device_udid
      );
      assert.strictEqual(
        responseData.response.subscription.platform,
        requestData.request.push_subscription_create.platform
      );
      assert.strictEqual(
        responseData.response.subscription.user_id.toString(),
        usersIds[0].toString()
      );
    });

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
      };

      let responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      );

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.strictEqual(
        responseData.response.subscription.web_endpoint,
        requestData.request.push_subscription_create.web_endpoint
      );
    });

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
      };

      let responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      );

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.success, undefined);
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Incorrect platform type.",
      });
    });

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
      };

      let responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      );

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.success, undefined);
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Incorrect platform type.",
      });
    });

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
      };

      let responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      );

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.success, undefined);
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Incorrect token.",
      });
    });

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
      };

      let responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      );

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.success, undefined);
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Incorrect keys.",
      });
    });

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
      };

      let responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      );

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.success, undefined);
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Incorrect keys.",
      });
    });

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
      };

      let responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      );

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.success, undefined);
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Incorrect deviceId.",
      });
    });
  });

  describe("List method", async () => {
    it("should work", async () => {
      const requestData = {
        request: {
          push_subscription_list: {
            user_id: usersIds[0].toString(),
          },
          id: 1,
        },
      };

      let responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      );

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.strictEqual(responseData.response.subscriptions.length, 1);
      assert.notEqual(
        responseData.response.subscriptions[0].platform,
        undefined
      );
      assert.notEqual(
        responseData.response.subscriptions[0].web_endpoint,
        undefined
      );
      assert.notEqual(
        responseData.response.subscriptions[0].web_key_auth,
        undefined
      );
      assert.notEqual(
        responseData.response.subscriptions[0].web_key_p256dh,
        undefined
      );
      assert.notEqual(
        responseData.response.subscriptions[0].device_udid,
        undefined
      );
      assert.notEqual(
        responseData.response.subscriptions[0].user_id,
        undefined
      );
    });

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
      };

      let responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestDataCreate)
      );

      responseData = responseData.backMessages.at(0)

      let requestData = {
        request: {
          push_subscription_list: {
            user_id: usersIds[0].toString(),
          },
          id: 1,
        },
      };

      responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      );

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.strictEqual(responseData.response.subscriptions.length, 2);
      assert.notEqual(
        responseData.response.subscriptions[1].platform,
        requestDataCreate.request.push_subscription_create.platform
      );
      assert.notEqual(
        responseData.response.subscriptions[1].web_endpoint,
        requestDataCreate.request.push_subscription_create.web_endpoint
      );
      assert.notEqual(
        responseData.response.subscriptions[1].web_key_auth,
        requestDataCreate.request.push_subscription_create.web_key_auth
      );
      assert.notEqual(
        responseData.response.subscriptions[1].web_key_p256dh,
        requestDataCreate.request.push_subscription_create.web_key_p256dh
      );
      assert.notEqual(
        responseData.response.subscriptions[1].device_udid,
        requestDataCreate.request.push_subscription_create.device_udid
      );
      assert.notEqual(
        responseData.response.subscriptions[1].user_id,
        requestDataCreate.request.push_subscription_create.user_id
      );
    });

    it("should fail, user_id is missed", async () => {
      const requestData = {
        request: {
          push_subscription_list: {},
          id: 1,
        },
      };

      let responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      );

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "User ID missed.",
      });
    });
  });

  describe("Delete method", async () => {
    it("should work", async () => {
      let requestData = {
        request: {
          push_subscription_delete: {
            device_udid: "device_2",
          },
          id: 1,
        },
      };

      let responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      );

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.strictEqual(responseData.response.success, true);

      requestData = {
        request: {
          push_subscription_list: {
            user_id: usersIds[0].toString(),
          },
          id: 1,
        },
      };

      responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      );

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.subscriptions.length, 1);
    });

    it("should fail, notification record not found", async () => {
      let requestData = {
        request: {
          push_subscription_delete: {
            device_udid: "device_2",
          },
          id: 1,
        },
      };

      let responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      );

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Push notification record not found.",
      });
    });

    it("should fail, device_udId is missed", async () => {
      let requestData = {
        request: {
          push_subscription_delete: {},
          id: 1,
        },
      };

      let responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      );

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "'deviceId' is required.",
      });
    });
  });

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
      };

      let responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      );

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.strictEqual(
        responseData.response.event.message,
        JSON.stringify(requestData.request.push_event_create.message)
      );
      assert.strictEqual(
        responseData.response.event.user_id,
        usersIds[0].toString()
      );
      assert.strictEqual(
        responseData.response.event.recipients_ids[0],
        usersIds[0].toString()
      );
      assert.strictEqual(
        responseData.response.event.recipients_ids[1],
        usersIds[1].toString()
      );
    });

    it("should fail, message is missed", async () => {
      const requestData = {
        request: {
          push_event_create: {
            recipients_ids: [usersIds[0].toString(), usersIds[1].toString()],
          },
          id: 1,
        },
      };

      let responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      );

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Notification message missed.",
      });
    });

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
      };

      let responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      );

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Incorrect recipients IDs.",
      });
    });

    it("should work, 1 recipients", async () => {
      const requestData = {
        request: {
          push_event_create: {
            recipients_ids: ["testId", usersIds[1].toString()],
            message: {
              title: "Title",
              topic: "topic",
              body: "this is message",
              message: "payload",
            },
          },
          id: 1,
        },
      };

      let responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      );

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.strictEqual(
        responseData.response.event.recipients_ids[0],
        usersIds[1].toString()
      );
    });

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
      };

      let responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      );

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Recipients not found.",
      });
    });
  });

  after(async () => {
    await User.clearCollection();
    await PushSubscription.clearCollection();
    await PushEvent.clearCollection();
    usersIds = [];
  });
});
