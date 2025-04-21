import ip from "ip"
import uWS from "uWebSockets.js"
import assert from "assert"

import ServiceLocatorContainer from "../app/common/ServiceLocatorContainer.js"
import clusterManager from "../app/cluster/cluster_manager.js"
import { generateNewOrganizationId, createConversation, createUserArray, mockedWS, sendLogin } from "./tools/utils.js"
import packetJsonProcessor from "../APIs/JSON/routes/packet_processor.js"
import packetManager from "../app/networking/packet_manager.js"

const sessionService = ServiceLocatorContainer.use("SessionService")
const userRepo = ServiceLocatorContainer.use("UserRepository")
const conversationRepo = ServiceLocatorContainer.use("ConversationRepository")
const conversationParticipantRepo = ServiceLocatorContainer.use("ConversationParticipantRepository")
const messageRepo = ServiceLocatorContainer.use("MessageRepository")
const messageStatusRepo = ServiceLocatorContainer.use("MessageStatusRepository")

let orgId = void 0
let currentConversationId = ""
let usersIds = []
let deviceId = null
let secondClusterPort = null
let secondSocketResponse = null

describe("Cluster Message function", async () => {
  before(async () => {
    orgId = await generateNewOrganizationId()
    usersIds = await createUserArray(orgId, 2)

    await sendLogin(mockedWS, orgId, "user_1")

    currentConversationId = await createConversation(mockedWS, null, null, "g", [usersIds[1], usersIds[0]])

    //emulate user2 connect in other node
    deviceId = sessionService.activeSessions.DEVICES[usersIds[0]][0].deviceId

    const SSL_APP_OPTIONS = {
      key_file_name: process.env.SSL_KEY_FILE_NAME,
      cert_file_name: process.env.SSL_CERT_FILE_NAME,
    }
    const CLUSTER_SOCKET = uWS.SSLApp(SSL_APP_OPTIONS)
    CLUSTER_SOCKET.listen(0, (listenSocket) => {
      if (listenSocket) {
        const clusterPort = uWS.us_socket_local_port(listenSocket)
        console.log(`CLUSTER listening on port ${clusterPort}`)
        secondClusterPort = clusterPort
      } else {
        throw "CLUSTER_SOCKET.listen error"
      }
    })

    clusterManager.clusterNodesWS[ip.address()] = {
      send: (data) => {
        secondSocketResponse = data
      },
    }
    await sessionService.storeUserNodeData(ip.address(), secondClusterPort, orgId, usersIds[1], deviceId)
  })

  describe("Send Message to other node", async () => {
    it("should work", async () => {
      const requestData = {
        message: {
          id: "xyz",
          body: "hey how is going?",
          cid: currentConversationId,
        },
      }

      const controllerResponse = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))
      const deliverMessage = controllerResponse.deliverMessages.at(0)

      assert.notEqual(deliverMessage, undefined)

      await packetManager.deliverToUserOrUsers(
        deliverMessage.ws || mockedWS,
        JSON.stringify(deliverMessage.packet),
        null,
        deliverMessage.userIds,
        deliverMessage.notSaveInOfflineStorage
      )

      const response = JSON.parse(secondSocketResponse).deliverPacket
      response.packet = JSON.parse(response.packet)

      assert.notEqual(response, undefined)

      assert.strictEqual(response.userId, usersIds[1].toString())
      assert.strictEqual(response.senderInfo.session.userId, usersIds[0].toString())

      assert.notEqual(response.packet, undefined)
      assert.strictEqual(response.packet.message.from, usersIds[0].toString())
      assert.strictEqual(response.packet.message.body, "hey how is going?")
    })
  })

  after(async () => {
    await userRepo.deleteMany({})
    await messageRepo.deleteMany({})
    await messageStatusRepo.deleteMany({})
    await conversationRepo.deleteMany({})
    await conversationParticipantRepo.deleteMany({})

    usersIds = []
  })
})
