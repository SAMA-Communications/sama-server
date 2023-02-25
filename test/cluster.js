import Conversation from "../models/conversation.js";
import ConversationParticipant from "../models/conversation_participant.js";
import Message from "../models/message.js";
import MessageStatus from "../models/message_status.js";
import SessionRepository from "../repositories/session_repository.js";
import User from "../models/user.js";
import assert from "assert";
import ip from "ip";
import uWS from "uWebSockets.js";
import { connectToDBPromise } from "../lib/db.js";
import {
  createConversation,
  createUserArray,
  mockedWS,
  sendLogin,
} from "./utils.js";
import { ACTIVE } from "../store/session.js";
import { clusterNodesWS } from "../cluster/cluster_manager.js";
import { default as PacketProcessor } from "./../routes/delivery_manager.js";

let currentConversationId = "";
let usersIds = [];
let deviceId = null;
let secondClusterPort = null;
let secondSocketResponse = null;

describe("Message function", async () => {
  before(async () => {
    await connectToDBPromise();
    usersIds = await createUserArray(2);

    await sendLogin(mockedWS, "user_1");

    currentConversationId = await createConversation(
      mockedWS,
      null,
      null,
      "g",
      [usersIds[1], usersIds[0]]
    );

    //emulate user2 connect in other node
    deviceId = ACTIVE.DEVICES[usersIds[0]][0].deviceId;

    const SSL_APP_OPTIONS = {
      key_file_name: process.env.SSL_KEY_FILE_NAME,
      cert_file_name: process.env.SSL_CERT_FILE_NAME,
    };
    const CLUSTER_SOCKET = uWS.SSLApp(SSL_APP_OPTIONS);
    CLUSTER_SOCKET.listen(0, (listenSocket) => {
      if (listenSocket) {
        const clusterPort = uWS.us_socket_local_port(listenSocket);
        console.log(`CLUSTER listening on port ${clusterPort}`);
        secondClusterPort = clusterPort;
      } else {
        throw "CLUSTER_SOCKET.listen error";
      }
    });

    clusterNodesWS[ip.address()] = {
      send: (data) => (secondSocketResponse = data),
    };
    await new SessionRepository().storeUserNodeData(
      usersIds[1],
      deviceId,
      ip.address(),
      secondClusterPort
    );
  });

  describe("Send Message to other node", async () => {
    it("should work", async () => {
      const requestData = {
        message: {
          id: "xyz",
          body: "hey how is going?",
          cid: currentConversationId,
        },
      };

      await PacketProcessor.processJsonMessageOrError(mockedWS, requestData);

      const response = JSON.parse(secondSocketResponse);
      assert.notEqual(response, undefined);
      assert.strictEqual(response.userId, usersIds[1].toString());
      assert.notEqual(response.message, undefined);
      assert.strictEqual(response.message.from, usersIds[0].toString());
      assert.strictEqual(response.message.body, "hey how is going?");
    });
  });

  after(async () => {
    await User.clearCollection();
    await Message.clearCollection();
    await MessageStatus.clearCollection();
    await Conversation.clearCollection();
    await ConversationParticipant.clearCollection();
    usersIds = [];
  });
});
