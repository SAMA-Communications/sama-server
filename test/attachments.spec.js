import assert from "assert"

import ServiceLocatorContainer from "../app/common/ServiceLocatorContainer.js"

import {
  generateNewOrganizationId,
  createConversation,
  createUserArray,
  mockedWS,
  sendLogin,
  sendLogout,
} from "./tools/utils.js"
import packetJsonProcessor from "../APIs/JSON/routes/packet_processor.js"

const userRepo = ServiceLocatorContainer.use("UserRepository")
const conversationRepo = ServiceLocatorContainer.use("ConversationRepository")
const conversationParticipantRepo = ServiceLocatorContainer.use("ConversationParticipantRepository")
const messageRepo = ServiceLocatorContainer.use("MessageRepository")
const messageStatusRepo = ServiceLocatorContainer.use("MessageStatusRepository")
const fileRepo = ServiceLocatorContainer.use("FileRepository")
const opLogsRepo = ServiceLocatorContainer.use("OperationsLogRepository")

let orgId = void 0
let currentUserToken = ""
let usersIds = []
let currentConversationId = ""
let files

describe("Attachments", async () => {
  before(async () => {
    await fileRepo.deleteMany({})

    orgId = await generateNewOrganizationId()
    usersIds = await createUserArray(orgId, 3)

    currentUserToken = (await sendLogin(mockedWS, orgId, "user_1")).response.user.token

    currentConversationId = await createConversation(mockedWS, null, null, "g", [usersIds[1], usersIds[2], usersIds[0]])
  })

  it("should work create upload url for 2 files", async () => {
    const requestData = {
      request: {
        create_files: [
          { name: "1.png", size: 123, content_type: "image" },
          { name: "2.png", size: 321, content_type: "image" },
        ],
        id: "createUploadUrlForFile",
      },
    }

    let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

    responseData = responseData.backMessages.at(0)

    files = responseData.response.files

    assert.strictEqual(requestData.request.id, responseData.response.id)
    assert.notEqual(responseData.response.files, undefined)

    assert.equal(files[0].name, "1.png")
    assert.equal(files[0].size, 123)
    assert.equal(files[0].content_type, "image")
    assert.equal(files[0].content_type, "image")
    assert.notEqual(files[0].object_id, undefined)
    assert.notEqual(files[0].upload_url, undefined)

    assert.equal(files[1].name, "2.png")
    assert.equal(files[1].size, 321)
    assert.equal(files[1].content_type, "image")
    assert.notEqual(files[1].object_id, undefined)
    assert.notEqual(files[1].upload_url, undefined)

    assert.equal(responseData.response.files.length, 2)
  })

  it("should work get download url for prev 2 files", async () => {
    const file_ids = files.map((obj) => obj.object_id)

    const requestData = {
      request: {
        get_file_urls: {
          file_ids: file_ids,
        },
        id: "createUploadUrlForFile",
      },
    }

    let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

    responseData = responseData.backMessages.at(0)

    const urls = responseData.response.file_urls

    assert.strictEqual(requestData.request.id, responseData.response.id)
    assert.notEqual(responseData.response.file_urls, undefined)

    assert.notEqual(urls[file_ids[0]], undefined)
    assert.notEqual(urls[file_ids[1]], undefined)

    assert.match(urls[file_ids[0]].split(":")[0], /https?/)
    assert.match(urls[file_ids[1]].split(":")[0], /https?/)

    assert.equal(Object.keys(responseData.response.file_urls).length, 2)
  })

  it("should fail file limit exceded", async () => {
    const requestData = {
      request: {
        create_files: [
          { name: "1.png", size: 123, content_type: "image" },
          { name: "2.png", size: 321, content_type: "image" },
          { name: "1.png", size: 123, content_type: "image" },
          { name: "2.png", size: 321, content_type: "image" },
          { name: "1.png", size: 123, content_type: "image" },
          { name: "2.png", size: 321, content_type: "image" },
          { name: "1.png", size: 123, content_type: "image" },
          { name: "1.png", size: 123, content_type: "image" },
          { name: "2.png", size: 321, content_type: "image" },
          { name: "1.png", size: 123, content_type: "image" },
          { name: "2.png", size: 321, content_type: "image" },
          { name: "1.png", size: 123, content_type: "image" },
          { name: "2.png", size: 321, content_type: "image" },
          { name: "2.png", size: 321, content_type: "image" },
        ],
        id: "createUploadUrlForFile",
      },
    }

    let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

    responseData = responseData.backMessages.at(0)

    assert.strictEqual(requestData.request.id, responseData.response.id)
    assert.strictEqual(responseData.response.file_urls, undefined)
    assert.deepEqual(responseData.response.error, {
      message: `You've exceeded the file limit.`,
      status: 422,
    })
  })

  it("should fail file name exceded", async () => {
    const requestData = {
      request: {
        create_files: [
          {
            name: "1asdbchmfcasgjksxbcagmhaxfndcbgdgbjxfjkahbesbvzvcbhjvxnmbgdsacfbsgvaxdxfjadsxbdfv1asdbchmfcasgj1asdbchmfcasgjksxbcagmhaxfndcbgdgbjxfjkahbesbvzvcbhjvxnmbgdsacfbsgvaxdxfjadsxbdfvksxbcagmhaxfndcbgdgbjxfjkahbesbvzvcbhjvxnmbgdsacfbsgvaxdxfjadsxbdfv1asdbchmfcasgjksxbcagmhaxfndcbgdgbjxfjkahbesbvzvcbhjvxnmbgdsacfbsgvaxdxfjadsxbdfv1asdbchmfcasgjksxbcagmhaxfndcbgdgbjxfjkahbesbvzvcbhjvxnmbgdsacfbsgvaxdxfjadsxbdfv1asdbchmfcasgjksxbcagmhaxfndcbgdgbjxfjkahbesbvzvcbhjvxnmbgdsacfbsgvaxdxfjadsxbdfv1asdbchmfcasgjksxbcagmhaxfndcbgdgbjxfjkahbesbvzvcbhjvxnmbgdsacfbsgvaxdxfjadsxbdfv1asdbchmfcasgjksxbcagmhaxfndcbgdgbjxfjkahbesbvzvcbhjvxnmbgdsacfbsgvaxdxfjadsxbdfv.png",
            size: 123,
            content_type: "image",
          },
        ],
        id: "createUploadUrlForFile",
      },
    }

    let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

    responseData = responseData.backMessages.at(0)

    assert.strictEqual(requestData.request.id, responseData.response.id)
    assert.strictEqual(responseData.response.file_urls, undefined)
    assert.deepEqual(responseData.response.error, {
      message: "Incorrect file name.",
      status: 422,
    })
  })

  it("should fail file_ids empty", async () => {
    const requestData = {
      request: {
        get_file_urls: {
          file_ids: [],
        },
        id: "createUploadUrlForFile",
      },
    }

    let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

    responseData = responseData.backMessages.at(0)

    assert.strictEqual(requestData.request.id, responseData.response.id)
    assert.strictEqual(responseData.response.file_urls, undefined)
    assert.deepEqual(responseData.response.error, {
      message: "File IDS missed.",
      status: 422,
    })
  })

  it("should fail file ids for get download links limit exceded ", async () => {
    const requestData = {
      request: {
        get_file_urls: {
          file_ids: ["1", "1", "1", "1", "1", "1", "1", "1", "1", "1", "1", "1", "1", "1", "1", "1"],
        },
        id: "createUploadUrlForFile",
      },
    }

    let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

    responseData = responseData.backMessages.at(0)

    assert.strictEqual(requestData.request.id, responseData.response.id)
    assert.strictEqual(responseData.response.file_urls, undefined)
    assert.deepEqual(responseData.response.error, {
      message: "File IDs for get download url exceeded.",
      status: 422,
    })
  })

  it("should fail File name missed.", async () => {
    const requestData = {
      request: {
        create_files: [{ size: 123, content_type: "image" }],
        id: "createUploadUrlForFile",
      },
    }

    let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

    responseData = responseData.backMessages.at(0)

    assert.strictEqual(requestData.request.id, responseData.response.id)
    assert.strictEqual(responseData.response.files, undefined)
    assert.deepEqual(responseData.response.error, {
      message: "Incorrect file name.",
      status: 422,
    })
  })

  it("should fail File size missed.", async () => {
    const requestData = {
      request: {
        create_files: [{ name: "1.png", content_type: "image" }],
        id: "createUploadUrlForFile",
      },
    }

    let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

    responseData = responseData.backMessages.at(0)

    assert.strictEqual(requestData.request.id, responseData.response.id)
    assert.strictEqual(responseData.response.files, undefined)
    assert.deepEqual(responseData.response.error, {
      message: "Incorrect file size.",
      status: 422,
    })
  })

  it("should fail File content type missed.", async () => {
    const requestData = {
      request: {
        create_files: [{ name: "1.png", size: 123 }],
        id: "createUploadUrlForFile",
      },
    }

    let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

    responseData = responseData.backMessages.at(0)

    assert.strictEqual(requestData.request.id, responseData.response.id)
    assert.strictEqual(responseData.response.files, undefined)
    assert.deepEqual(responseData.response.error, {
      message: "Incorrect content type.",
      status: 422,
    })

    await sendLogout(mockedWS, currentUserToken)
  })

  after(async () => {
    await userRepo.deleteMany({})
    await messageRepo.deleteMany({})
    await messageStatusRepo.deleteMany({})
    await conversationRepo.deleteMany({})
    await conversationParticipantRepo.deleteMany({})
    await fileRepo.deleteMany({})
    await opLogsRepo.deleteMany({})

    usersIds = []
  })
})
