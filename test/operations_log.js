import OpLog from './../app/models/operations_log.js'
import operationsLogRepository from './../app/repositories/operations_log_repository.js'
import ServiceLocatorContainer from '../app/common/ServiceLocatorContainer.js'
import assert from 'assert'
import { createUserArray, mockedWS, sendLogin } from './utils.js'
import packetJsonProcessor from '../APIs/JSON/routes/packet_processor.js'

let timeWhenUserOff = null
let usersIds = []

describe('Operations Log functions', async () => {
  before(async () => {
    await OpLog.clearCollection()
    usersIds = await createUserArray(2)

    await sendLogin(mockedWS, 'user_1')

    for (let i = 0; i < 2; i++) {
      await operationsLogRepository.savePacket(usersIds[1], JSON.stringify(
        {
          message_update: {
            id: `mid${i}`,
            body: `body${i}`,
          },
        }
      ))
    }
  })

  describe('Get record from OpLog', async () => {
    it('should fail', async () => {
      await sendLogin(mockedWS, 'user_2')

      const requestData = {
        request: {
          op_log_list: {
            created_at: {
              lt: null,
            },
          },
          id: 'lt_sample',
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      )

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.equal(responseData.response.logs, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: 'Gt or lt query missed.',
      })
    })

    it('should work lt param', async () => {
      timeWhenUserOff = new Date()
      const requestData = {
        request: {
          op_log_list: {
            created_at: {
              lt: timeWhenUserOff,
            },
          },
          id: 'lt_sample',
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      )

      responseData = responseData.backMessages.at(0).packet

      for (let i = 2; i < 6; i++) {
        await operationsLogRepository.savePacket(usersIds[1], JSON.stringify(
          {
            message_update: {
              id: `mid${i}`,
              body: `body${i}`,
            },
          }
        ))
      }

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.equal(responseData.response.logs.length, 2)
    })

    it('should work gt param', async () => {
      await sendLogin(mockedWS, 'user_2')

      const requestData = {
        request: {
          op_log_list: {
            created_at: {
              gt: timeWhenUserOff,
            },
          },
          id: 'gt_sample',
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      )

      responseData = responseData.backMessages.at(0).packet

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.equal(responseData.response.logs.length, 4)
    })
  })

  after(async () => {
    const userRepo = ServiceLocatorContainer.use('UserRepository')
    await userRepo.deleteMany({})
    await OpLog.clearCollection()
    usersIds = []
  })
})
