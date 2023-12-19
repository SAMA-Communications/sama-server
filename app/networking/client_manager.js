import ip from 'ip'
import uWS from 'uWebSockets.js'
import { StringDecoder } from 'string_decoder'

import SessionRepository from '../repositories/session_repository.js'
import clusterManager from '../cluster/cluster_manager.js'
import { ACTIVE } from '../store/session.js'
import { ERROR_STATUES } from '../constants/errors.js'
import packetManager from './packet_manager.js'
import packetMapper from './packet_mapper.js'
import activitySender from '../services/activity_sender.js'
import { APIs, detectAPIType } from './APIs.js'

import MappableMessage from './models/MappableMessage.js'

const decoder = new StringDecoder('utf8')
const sessionRepository = new SessionRepository(ACTIVE)

const onMessage = async (ws, message) => {
  const stringMessage = decoder.write(Buffer.from(message))

  if (!ws.apiType) {
    const apiType = detectAPIType(ws, stringMessage)
    if (!apiType) {
      throw new Error('Unknown message format')
    }
    ws.apiType = apiType.at(0)
  }

  const api = APIs[ws.apiType]
  const response = await api.onMessage(ws, stringMessage)

  const mapBackMessageFunc = async (packet) => packetMapper.mapPacket(null, ws.apiType, packet)

  for (let backMessage of response.backMessages) {
    try {
      if (backMessage instanceof MappableMessage) {
        backMessage = await backMessage.mapMessage(mapBackMessageFunc)
      }
      console.log('[SENT]', backMessage)
      ws.send(backMessage)
    } catch (e) {
      console.error(
        '[ClientManager] connection with client ws is lost'
      )
    }
  }

  for (const deliverMessage of response.deliverMessages) {
    try {
      console.log('[DELIVER]', deliverMessage.usersIds, deliverMessage)
      await packetManager.deliverToUserOrUsers(
        deliverMessage.ws || ws,
        deliverMessage.packet,
        deliverMessage.userIds,
        deliverMessage.notSaveInOfflineStorage
      )
    } catch (e) {
      console.error(
        '[ClientManager] connection with client ws is lost'
      )
    }
  }

  if (response.lastActivityStatus) {
    const userId = sessionRepository.getSessionUserId(ws)
    console.log('[UPDATE_LAST_ACTIVITY]', userId, response.lastActivityStatus)
    await activitySender.updateAndSendUserActivity(ws, userId, response.lastActivityStatus)
  }
}

class ClientManager {
  #localSocket = null

  async createLocalSocket(appOptions, wsOptions, listenOptions, isSSL, port) {
    this.#localSocket = isSSL ? uWS.SSLApp(appOptions) : uWS.App(appOptions)

    this.#localSocket.ws('/*', {
      ...wsOptions,

      open: (ws) => {
        console.log(
          '[ClientManager] ws on Open',
          `IP: ${Buffer.from(ws.getRemoteAddressAsText()).toString()}`
        )
      },

      close: async (ws, code, message) => {
        console.log('[ClientManager] ws on Close')

        const userId = sessionRepository.getSessionUserId(ws)
        const arrDevices = ACTIVE.DEVICES[userId]

        if (arrDevices) {
          ACTIVE.DEVICES[userId] = arrDevices.filter((obj) => {
            if (obj.ws === ws) {
              sessionRepository.removeUserNodeData(
                userId,
                obj.deviceId,
                ip.address(),
                clusterManager.clusterPort
              )
              return false
            }
            return true
          })
          await activitySender.updateAndSendUserActivity(ws, userId, 'offline')
        }
        ACTIVE.SESSIONS.delete(ws)
      },

      message: async (ws, message, isBinary) => {
        try {
          await onMessage(ws, message)
        } catch (err) {
          const rawPacket = decoder.write(Buffer.from(message))
          console.error('[ClientManager] ws on message error', err, rawPacket)
          ws.send(
            JSON.stringify({
              response: {
                error: {
                  status: ERROR_STATUES.INVALID_DATA_FORMAT.status,
                  message: ERROR_STATUES.INVALID_DATA_FORMAT.message,
                },
              },
            })
          )
        }
      },
    })

    this.#localSocket.listen(port, listenOptions, (listenSocket) => {
      if (listenSocket) {
        console.log(
          `[ClientManager][createLocalSocket] listening on port ${uWS.us_socket_local_port(
            listenSocket
          )}, pid=${process.pid}`
        )
      } else {
        throw `[ClientManager][createLocalSocket] socket.listen error: can't allocate port`
      }
    })
  }
}

export default new ClientManager()
