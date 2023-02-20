import Conversation from "../models/conversation.js";
import ConversationParticipant from "../models/conversation_participant.js";
import Message from "../models/message.js";
import OpLog from "../models/operations_log.js";
import User from "../models/user.js";
import assert from "assert";
import { connectToDBPromise } from "../lib/db.js";
import {
  createConversation,
  createUserArray,
  mockedWS,
  sendLogin,
  sendLogout,
} from "./utils.js";
import { default as PacketProcessor } from "./../routes/delivery_manager.js";

let currentUserToken = "";
let usersIds = [];
let currentConversationId = "";
let files;

describe("Attachments", async () => {
  before(async () => {
    await connectToDBPromise();
    usersIds = await createUserArray(3);

    currentUserToken = (await sendLogin(mockedWS, "user_1")).response.user
      .token;

    currentConversationId = await createConversation(
      mockedWS,
      null,
      null,
      "g",
      [usersIds[1], usersIds[2], usersIds[0]]
    );
  });

  it("should work create upload url for 2 files", async () => {
    const requestData = {
      request: {
        create_files: [
          { name: "1.png", size: 123, content_type: "image" },
          { name: "2.png", size: 321, content_type: "image" },
        ],
        id: "createUploadUrlForFile",
      },
    };
    const responseData = await PacketProcessor.processJsonMessageOrError(
      mockedWS,
      requestData
    );
    files = responseData.response.files;

    assert.strictEqual(requestData.request.id, responseData.response.id);
    assert.notEqual(responseData.response.files, undefined);

    assert.equal(files[0].name, "1.png");
    assert.equal(files[0].size, 123);
    assert.equal(files[0].content_type, "image");

    assert.equal(files[1].name, "2.png");
    assert.equal(files[1].size, 321);
    assert.equal(files[1].content_type, "image");

    assert.equal(responseData.response.files.length, 2);
  });

  it("should work get download url for prev 2 files", async () => {
    const file_ids = files.map((obj) => obj.object_id);
    const requestData = {
      request: {
        get_file_urls: {
          file_ids: file_ids,
        },
        id: "createUploadUrlForFile",
      },
    };
    const responseData = await PacketProcessor.processJsonMessageOrError(
      mockedWS,
      requestData
    );
    const urls = responseData.response.file_urls;

    assert.strictEqual(requestData.request.id, responseData.response.id);
    assert.notEqual(responseData.response.file_urls, undefined);

    assert.notEqual(urls[file_ids[0]], undefined);
    assert.notEqual(urls[file_ids[1]], undefined);

    assert.equal(urls[file_ids[0]].split(":")[0], "http");
    assert.equal(urls[file_ids[1]].split(":")[0], "http");

    assert.equal(Object.keys(responseData.response.file_urls).length, 2);
  });

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
    };
    const responseData = await PacketProcessor.processJsonMessageOrError(
      mockedWS,
      requestData
    );
    assert.strictEqual(requestData.request.id, responseData.response.id);
    assert.strictEqual(responseData.response.file_urls, undefined);
    assert.deepEqual(responseData.response.error, {
      message: "File limit exceded",
      status: 422,
    });
  });

  it("should fail file_ids empty", async () => {
    const requestData = {
      request: {
        get_file_urls: {
          file_ids: [],
        },
        id: "createUploadUrlForFile",
      },
    };
    const responseData = await PacketProcessor.processJsonMessageOrError(
      mockedWS,
      requestData
    );
    assert.strictEqual(requestData.request.id, responseData.response.id);
    assert.strictEqual(responseData.response.file_urls, undefined);
    assert.deepEqual(responseData.response.error, {
      message: "File IDS missed",
      status: 422,
    });
  });

  it("should fail file ids for get download links limit exceded ", async () => {
    const requestData = {
      request: {
        get_file_urls: {
          file_ids: [
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
          ],
        },
        id: "createUploadUrlForFile",
      },
    };
    const responseData = await PacketProcessor.processJsonMessageOrError(
      mockedWS,
      requestData
    );
    assert.strictEqual(requestData.request.id, responseData.response.id);
    assert.strictEqual(responseData.response.file_urls, undefined);
    assert.deepEqual(responseData.response.error, {
      message: "File ids for get download url exceeded",
      status: 422,
    });
  });

  it("should fail file name missed", async () => {
    const requestData = {
      request: {
        create_files: [{ size: 123, content_type: "image" }],
        id: "createUploadUrlForFile",
      },
    };
    const responseData = await PacketProcessor.processJsonMessageOrError(
      mockedWS,
      requestData
    );

    assert.strictEqual(requestData.request.id, responseData.response.id);
    assert.strictEqual(responseData.response.files, undefined);
    assert.deepEqual(responseData.response.error, {
      message: "File name missed",
      status: 422,
    });
  });

  it("should fail file size missed", async () => {
    const requestData = {
      request: {
        create_files: [{ name: "1.png", content_type: "image" }],
        id: "createUploadUrlForFile",
      },
    };
    const responseData = await PacketProcessor.processJsonMessageOrError(
      mockedWS,
      requestData
    );

    assert.strictEqual(requestData.request.id, responseData.response.id);
    assert.strictEqual(responseData.response.files, undefined);
    assert.deepEqual(responseData.response.error, {
      message: "File size missed",
      status: 422,
    });
  });

  it("should fail file content type missed", async () => {
    const requestData = {
      request: {
        create_files: [{ name: "1.png", size: 123 }],
        id: "createUploadUrlForFile",
      },
    };
    const responseData = await PacketProcessor.processJsonMessageOrError(
      mockedWS,
      requestData
    );

    assert.strictEqual(requestData.request.id, responseData.response.id);
    assert.strictEqual(responseData.response.files, undefined);
    assert.deepEqual(responseData.response.error, {
      message: "File content type missed",
      status: 422,
    });

    await sendLogout(mockedWS, currentUserToken);
  });

  after(async () => {
    await User.clearCollection();
    await OpLog.clearCollection();
    await Message.clearCollection();
    await Conversation.clearCollection();
    await ConversationParticipant.clearCollection();
    usersIds = [];
  });
});
