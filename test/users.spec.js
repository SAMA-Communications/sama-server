import assert from "assert"

import ServiceLocatorContainer from "../app/common/ServiceLocatorContainer.js"

import { generateNewOrganizationId } from "./tools/utils.js"

import packetJsonProcessor from "../APIs/JSON/routes/packet_processor.js"

const userRepo = ServiceLocatorContainer.use("UserRepository")

let orgId = void 0
let userLogin = [...Array(30)].map(() => Math.random().toString(36)[2]).join("")
const createdUsers = []
const tmpUsersIds = []

describe("User cycle", async () => {
  before(async () => {
    await userRepo.deleteMany({})
    orgId = await generateNewOrganizationId()
  })

  describe("Create User", async () => {
    it("should work", async () => {
      const requestData = {
        request: {
          user_create: {
            organization_id: orgId,
            login: userLogin,
            email: "email_1",
            phone: "phone_1",
            password: "user_paswword_1",
            device_id: "deveice1",
          },
          id: "1_1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)
      tmpUsersIds.push(responseData.response.user._id)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.notEqual(responseData.response.user, undefined)
      assert.equal(responseData.response.error, undefined)

      createdUsers.push(responseData.response.user)
    })

    it("should fail user login is already exist", async () => {
      let requestData = {
        request: {
          user_create: {
            organization_id: orgId,
            login: "test_register",
            password: "user_paswword_1",
            device_id: "deveice1",
          },
          id: "1_2_0",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))
      responseData = responseData.backMessages.at(0)
      createdUsers.push(responseData.response.user)

      requestData = {
        request: {
          user_create: {
            organization_id: orgId,
            login: "TeSt_REGISTER",
            password: "user_paswword_2",
            device_id: "deveice1",
          },
          id: "1_2_0",
        },
      }

      responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.strictEqual(responseData.response.user, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "The provided data is already associated with an existing user account.",
      })
    })

    it("should fail when email already taken", async () => {
      const requestData = {
        request: {
          user_create: {
            organization_id: orgId,
            login: "test_login",
            email: "email_1",
            password: "user_paswword_1",
            device_id: "deveice1",
          },
          id: "1_2",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.strictEqual(responseData.response.user, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "The provided data is already associated with an existing user account.",
      })
    })

    it("should fail when phone already taken", async () => {
      const requestData = {
        request: {
          user_create: {
            organization_id: orgId,
            login: "test_login",
            phone: "phone_1",
            password: "user_paswword_1",
            device_id: "deveice1",
          },
          id: "1_2",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.strictEqual(responseData.response.user, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "The provided data is already associated with an existing user account.",
      })
    })

    it("should fail when login already taken", async () => {
      const requestData = {
        request: {
          user_create: {
            organization_id: orgId,
            login: userLogin,
            password: "user_paswword_1",
            device_id: "deveice1",
          },
          id: "1_2",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.strictEqual(responseData.response.user, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "The provided data is already associated with an existing user account.",
      })
    })
  })

  describe("Login User", async () => {
    it("should fail because the user does not exist", async () => {
      const requestData = {
        request: {
          user_login: {
            organization_id: orgId,
            device_id: "PC",
            login: "user_testtttt",
            password: "user_paswword_1",
          },
          id: "2_1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.user, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 401,
        message: "Incorrect username or password.",
      })
    })

    it("should fail because the password is incorrect", async () => {
      const requestData = {
        request: {
          user_login: {
            organization_id: orgId,
            device_id: "PC",
            login: userLogin,
            password: "Invalid_password213",
          },
          id: "2_2",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.strictEqual(responseData.response.user, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 401,
        message: "Incorrect username or password.",
      })
    })

    it(`should fail 'device_id' is required.`, async () => {
      const requestData = {
        request: {
          user_login: {
            organization_id: orgId,
            login: userLogin,
            password: "Invalid_password213",
          },
          id: "3_2",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.success, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: `'device_id' is required.`,
      })
    })

    it("should work", async () => {
      const requestData = {
        request: {
          user_login: {
            organization_id: orgId,
            device_id: "PC",
            login: userLogin,
            password: "user_paswword_1",
          },
          id: "2_3",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.notEqual(responseData.response.user, undefined)
      assert.equal(responseData.response.error, undefined)
    })
  })

  describe("Get Users By IDs", async () => {
    it(`should fail ids array is empty`, async () => {
      const requestData = {
        request: {
          get_users_by_ids: {
            ids: [],
          },
          id: "5_2",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.success, undefined)
      assert.deepEqual(responseData.response.error, '"ids" must contain at least 1 items')
    })

    it(`should work incorrect ids`, async () => {
      const requestData = {
        request: {
          get_users_by_ids: {
            ids: ["test1", "test2"],
          },
          id: "5_3",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      const count = responseData.response.users.length
      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.strictEqual(count, 0)
      assert.deepEqual(responseData.response.error, undefined)
    })

    it("should work", async () => {
      const requestData = {
        request: {
          get_users_by_ids: {
            ids: tmpUsersIds,
          },
          id: "5_1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)
      const userResult = responseData.response.users

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.notEqual(responseData.response.users, undefined)
      assert.equal(userResult.at(0).login, userLogin)
      assert.equal(userResult.length, 1)
      assert.equal(responseData.response.error, undefined)
    })
  })

  describe("Edit User", async () => {
    it("should work update password", async () => {
      const requestData = {
        request: {
          user_edit: {
            current_password: "user_paswword_1",
            new_password: "312sad",
          },
          id: "5_1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.notEqual(responseData.response.user, undefined)
      assert.equal(responseData.response.user?.login, userLogin)
      assert.equal(responseData.response.error, undefined)
    })

    it("should work login with new password", async () => {
      const requestData = {
        request: {
          user_login: {
            organization_id: orgId,
            device_id: "123",
            login: userLogin,
            password: "312sad",
          },
          id: "2_3",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.notEqual(responseData.response.user, undefined)
      assert.equal(responseData.response.user?.login, userLogin)
      assert.equal(responseData.response.error, undefined)
    })

    it("should fail invalid current password", async () => {
      const requestData = {
        request: {
          user_edit: {
            current_password: "asdaseqw",
            new_password: "312sad",
          },
          id: "5_1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.strictEqual(responseData.response.user, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 401,
        message: "The current password you entered is incorrect.",
      })
    })

    it("should fail current password messing", async () => {
      const requestData = {
        request: {
          user_edit: {
            new_password: "312sad",
          },
          id: "5_1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.strictEqual(responseData.response.user, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 401,
        message: "The current password you entered is incorrect.",
      })
    })

    it("should work update email", async () => {
      const requestData = {
        request: {
          user_edit: {
            email: "email@.email.com",
          },
          id: "5_1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.notEqual(responseData.response.user, undefined)
      assert.equal(responseData.response.user.email, requestData.request.user_edit.email)
      assert.equal(responseData.response.error, undefined)
    })

    it("should work update phone", async () => {
      const requestData = {
        request: {
          user_edit: {
            phone: "phone_312",
          },
          id: "5_1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.notEqual(responseData.response.user, undefined)
      assert.equal(responseData.response.user.phone, requestData.request.user_edit.phone)
      assert.equal(responseData.response.error, undefined)
    })

    it("should work update login", async () => {
      const requestData = {
        request: {
          user_edit: {
            login: "login_123",
          },
          id: "5_1",
        },
      }

      userLogin = "login_123"

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.notEqual(responseData.response.user, undefined)
      assert.equal(responseData.response.user.login, requestData.request.user_edit.login)
      assert.equal(responseData.response.error, undefined)
    })

    it("should fail login is already in use", async () => {
      let requestData = {
        request: {
          user_create: {
            organization_id: orgId,
            login: "login_12345",
            password: "new_pasw31",
            email: "copyemail@email.com",
            phone: "copy_phone",
            device_id: "pc",
          },
          id: "5_2",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      requestData = {
        request: {
          user_edit: {
            login: "login_12345",
          },
          id: "5_1",
        },
      }

      responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.strictEqual(responseData.response.user, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "The provided data is already associated with an existing user account.",
      })
    })

    it("should fail email is already in use", async () => {
      const requestData = {
        request: {
          user_edit: {
            email: "copyemail@email.com",
          },
          id: "5_1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.strictEqual(responseData.response.user, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "The provided data is already associated with an existing user account.",
      })
    })

    it("should fail phone is already in use", async () => {
      const requestData = {
        request: {
          user_edit: {
            phone: "copy_phone",
          },
          id: "5_1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.strictEqual(responseData.response.user, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "The provided data is already associated with an existing user account.",
      })
    })
  })

  describe("List Users", async () => {
    it("list by ids", async () => {
      const userIds = createdUsers.map((user) => user._id.toString())

      const requestData = {
        request: {
          get_users_by_ids: {
            ids: userIds,
          },
          id: "1_list_users",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.strictEqual(responseData.response.users.length, 2)
    })
  })

  describe("Logout User", async () => {
    it("should work", async () => {
      const requestData = {
        request: {
          user_logout: {},
          id: "3_1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.notEqual(responseData.response.success, undefined)
      assert.equal(responseData.response.error, undefined)

      await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))
    })

    it("should fail user isn`t online", async () => {
      const requestData = {
        request: {
          user_logout: {},
          id: "3_2",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.strictEqual(responseData.response.success, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 401,
        message: "Unauthorized.",
      })
    })
  })

  describe("Delete User", async () => {
    it("should fail user not login", async () => {
      let requestData = {
        request: {
          user_delete: {},
          id: "4_2",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.strictEqual(responseData.response.success, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 401,
        message: "Unauthorized.",
      })

      requestData = {
        request: {
          user_login: {
            organization_id: orgId,
            device_id: "PC",
            login: userLogin,
            password: "312sad",
          },
          id: "2_3",
        },
      }

      await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))
    })

    it("should work", async () => {
      const requestData = {
        request: {
          user_delete: {},
          id: "4_1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.notEqual(responseData.response.success, undefined)
      assert.equal(responseData.response.error, undefined)
    })
  })

  after(async () => {
    await userRepo.deleteMany({})
  })
})
