import assert from 'assert'

import User from './../app/models/user.js'
import { ACTIVITY } from './../app/store/activity.js'
import { connectToDBPromise, getClient } from './../app/lib/db.js'
import packetJsonProcessor from '../APIs/JSON/routes/packet_processor.js'
import { createUserArray, sendLogin, sendLogout } from './utils.js'

let currentUserToken1 = ''
let currentUserToken = ''
let usersIds = []

describe('User activities', async () => {
  before(async () => {
    await connectToDBPromise()
    usersIds = await createUserArray(3)
    currentUserToken1 = (await sendLogin('line_2', 'user_3')).response.user
      .token
    currentUserToken = (await sendLogin('line_1', 'user_1')).response.user
      .token
  })

  it('should work subscribe', async () => {
    const requestData = {
      request: {
        user_last_activity_subscribe: {
          id: usersIds[1],
        },
        id: '1',
      },
    }

    let responseData = await packetJsonProcessor.processMessageOrError(
      'line_1',
      JSON.stringify(requestData)
    )

    responseData = responseData.backMessages.at(0)

    assert.strictEqual(responseData.response.id, requestData.request.id)
    assert.equal(ACTIVITY.SUBSCRIBED_TO[usersIds[0]], usersIds[1])
    assert.notEqual(ACTIVITY.SUBSCRIBERS[usersIds[1]][usersIds[0]], undefined)
    assert.notEqual(responseData.response.last_activity, undefined)
  })

  it('should fail User ID missed.', async () => {
    const requestData = {
      request: {
        user_last_activity_subscribe: {},
        id: '1',
      },
    }

    let responseData = await packetJsonProcessor.processMessageOrError(
      'line_1',
      JSON.stringify(requestData)
    )

    responseData = responseData.backMessages.at(0)

    assert.strictEqual(responseData.response.id, requestData.request.id)
    assert.deepEqual(responseData.response.error, {
      status: 422,
      message: 'User ID missed.',
    })
  })

  it('should work unsubscribe #1', async () => {
    let requestData = {
      request: {
        user_last_activity_subscribe: {
          id: usersIds[1],
        },
        id: '1',
      },
    }

    let responseData = await packetJsonProcessor.processMessageOrError(
      'line_2',
      JSON.stringify(requestData)
    )

    responseData = responseData.backMessages.at(0)

    requestData = {
      request: {
        user_last_activity_unsubscribe: {},
        id: '1',
      },
    }
  
    responseData = await packetJsonProcessor.processMessageOrError(
      'line_1',
      JSON.stringify(requestData)
    )

    responseData = responseData.backMessages.at(0)

    await sendLogout('line_1', currentUserToken)

    assert.strictEqual(responseData.response.id, requestData.request.id)
    assert.strictEqual(responseData.response.success, true)
    assert.equal(ACTIVITY.SUBSCRIBED_TO[usersIds[0]], undefined)
    assert.notEqual(ACTIVITY.SUBSCRIBERS[usersIds[1]], undefined)
    assert.equal(ACTIVITY.SUBSCRIBERS[usersIds[1]][usersIds[0]], undefined)
  })

  it('should work getUserStatus', async () => {
    const requestData = {
      request: {
        user_last_activity: {
          ids: [usersIds[2], usersIds[0]],
        },
        id: '1',
      },
    }
  
    let responseData = await packetJsonProcessor.processMessageOrError(
      'line_2',
      JSON.stringify(requestData)
    )

    responseData = responseData.backMessages.at(0)

    assert.strictEqual(responseData.response.id, requestData.request.id)
    assert.notEqual(responseData.response.last_activity, undefined)
    assert.equal(responseData.response.last_activity[usersIds[2]], 'online')
  })

  it('should work unsubscribe #2', async () => {
    const requestData = {
      request: {
        user_last_activity_unsubscribe: {},
        id: '1',
      },
    }

    let responseData = await packetJsonProcessor.processMessageOrError(
      'line_2',
      JSON.stringify(requestData)
    )

    responseData = responseData.backMessages.at(0)

    assert.strictEqual(responseData.response.id, requestData.request.id)
    assert.strictEqual(responseData.response.success, true)
    assert.equal(ACTIVITY.SUBSCRIBED_TO[usersIds[2]], undefined)
    assert.equal(ACTIVITY.SUBSCRIBERS[usersIds[1]], undefined)

    await sendLogout('line_2', currentUserToken1)
  })

  after(async () => {
    await User.clearCollection()
    await getClient().close()
  })
})
