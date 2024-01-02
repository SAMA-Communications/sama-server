import Conversation from './../app/models/conversation.js'
import ConversationParticipant from './../app/models/conversation_participant.js'
import Message from './../app/models/message.js'
import MessageStatus from './../app/models/message_status.js'
import sessionRepository from './../app/repositories/session_repository.js'
import User from './../app/models/user.js'
import assert from 'assert'
import clusterManager from './../app/cluster/cluster_manager.js'
import ip from 'ip'
import uWS from 'uWebSockets.js'
import {
  createConversation,
  createUserArray,
  mockedWS,
  sendLogin,
} from './utils.js'
import { ACTIVE } from './../app/store/session.js'
import packetJsonProcessor from '../APIs/JSON/routes/packet_processor.js'
import packetManager from './../app/networking/packet_manager.js'

let currentConversationId = ''
let usersIds = []
let deviceId = null
let secondClusterPort = null
let secondSocketResponse = null

describe('Cluster Message function', async () => {
  before(async () => {
    usersIds = await createUserArray(2)

    await sendLogin(mockedWS, 'user_1')

    currentConversationId = await createConversation(
      mockedWS,
      null,
      null,
      'g',
      [usersIds[1], usersIds[0]]
    )

    //emulate user2 connect in other node
    deviceId = ACTIVE.DEVICES[usersIds[0]][0].deviceId

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
        throw 'CLUSTER_SOCKET.listen error'
      }
    })

    clusterManager.clusterNodesWS[ip.address()] = {
      send: (data) => {
        secondSocketResponse = data
      },
    }
    await sessionRepository.storeUserNodeData(
      usersIds[1],
      deviceId,
      ip.address(),
      secondClusterPort
    )
  })

  describe('Send Message to other node', async () => {
    it('should work', async () => {
      const requestData = {
        message: {
          id: 'xyz',
          body: 'hey how is going?',
          cid: currentConversationId,
        },
      }

      const controllerResponse = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))
      const deliverMessage = controllerResponse.deliverMessages.at(0)

      assert.notEqual(deliverMessage, undefined)

      await packetManager.deliverToUserOrUsers(
        deliverMessage.ws || mockedWS,
        JSON.stringify(deliverMessage.packet),
        deliverMessage.userIds,
        deliverMessage.notSaveInOfflineStorage
      )

      const response = JSON.parse(secondSocketResponse)
      response.message = JSON.parse(response.message)

      assert.notEqual(response, undefined)
      assert.strictEqual(response.userId, usersIds[1].toString())
      assert.notEqual(response.message, undefined)
      assert.strictEqual(response.message.message.from, usersIds[0].toString())
      assert.strictEqual(response.message.message.body, 'hey how is going?')
    })
  })

  after(async () => {
    await User.clearCollection()
    await Message.clearCollection()
    await MessageStatus.clearCollection()
    await Conversation.clearCollection()
    await ConversationParticipant.clearCollection()
    usersIds = []
  })
})
