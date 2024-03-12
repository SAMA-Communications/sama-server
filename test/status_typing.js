import assert from 'assert'

import ServiceLocatorContainer from '../app/common/ServiceLocatorContainer.js'

import {
  createConversation,
  createUserArray,
  mockedWS,
  sendLogin,
  sendLogout,
} from './utils.js'
import packetJsonProcessor from '../APIs/JSON/routes/packet_processor.js'

const userRepo = ServiceLocatorContainer.use('UserRepository')

let currentConversationId = ''
let currentUserToken = ''
let userId = []

describe(`Sending 'typing' status`, async () => {
  before(async () => {
    userId = await createUserArray(2)

    currentUserToken = (await sendLogin(mockedWS, 'user_1')).response.user
      .token

    currentConversationId = await createConversation(
      mockedWS,
      null,
      null,
      'g',
      [userId[1], userId[0]]
    )

    await sendLogout(mockedWS, currentUserToken)
  })

  it('should fail user not login', async () => {
    const requestData = {
      typing: {
        id: 'xyz',
        type: 'start',
        cid: currentConversationId,
      },
    }

    let responseData = await packetJsonProcessor.processMessageOrError(
      mockedWS,
      JSON.stringify(requestData)
    )

    responseData = responseData.backMessages.at(0)

    assert.strictEqual(responseData.typing.user, undefined)
    assert.deepEqual(responseData.typing.error, {
      status: 404,
      message: 'Unauthorized.',
    })

    await sendLogin(mockedWS, 'user_1')
  })

  it('should fail id missed', async () => {
    const requestData = {
      typing: {
        type: 'start',
        cid: currentConversationId,
      },
    }

    let responseData = await packetJsonProcessor.processMessageOrError(
      mockedWS,
      JSON.stringify(requestData)
    )

    responseData = responseData.backMessages.at(0)

    assert.strictEqual(responseData.typing.user, undefined)
    assert.deepEqual(responseData.typing.error, {
      status: 422,
      message: 'Status ID missed.',
    })
  })

  it('should fail type missed', async () => {
    const requestData = {
      typing: {
        id: 'xyz',
        cid: currentConversationId,
      },
    }

    let responseData = await packetJsonProcessor.processMessageOrError(
      mockedWS,
      JSON.stringify(requestData)
    )

    responseData = responseData.backMessages.at(0)

    assert.strictEqual(responseData.typing.user, undefined)
    assert.deepEqual(responseData.typing.error, {
      status: 422,
      message: 'Status type missed.',
    })
  })

  it('should fail type incorrect', async () => {
    const requestData = {
      typing: {
        id: 'xyz',
        type: 'asdvsa123',
        cid: currentConversationId,
      },
    }

    let responseData = await packetJsonProcessor.processMessageOrError(
      mockedWS,
      JSON.stringify(requestData)
    )

    responseData = responseData.backMessages.at(0)

    assert.strictEqual(responseData.typing.user, undefined)
    assert.deepEqual(responseData.typing.error, {
      status: 422,
      message: 'The type you entered is incorrect.',
    })
  })

  it('should fail cid or to missed', async () => {
    const requestData = {
      typing: {
        id: 'xyz',
        type: 'start',
      },
    }

    let responseData = await packetJsonProcessor.processMessageOrError(
      mockedWS,
      JSON.stringify(requestData)
    )

    responseData = responseData.backMessages.at(0)

    assert.strictEqual(responseData.typing.user, undefined)
    assert.deepEqual(responseData.typing.error, {
      status: 422,
      message: `'cid' field is required.`,
    })
  })

  it('should fail Conversation not found', async () => {
    const requestData = {
      typing: {
        id: 'xyz',
        type: 'start',
        cid: 'currentConversationId',
        t: 15673838833,
      },
    }

    let responseData = await packetJsonProcessor.processMessageOrError(
      mockedWS,
      JSON.stringify(requestData)
    )

    responseData = responseData.backMessages.at(0)

    assert.strictEqual(responseData.typing.user, undefined)
    assert.deepEqual(responseData.typing.error, {
      status: 404,
      message: 'Conversation not found.',
    })
  })

  it('should work', async () => {
    const requestData = {
      typing: {
        id: 'xyz',
        type: 'start',
        cid: currentConversationId,
        t: 15673838833,
      },
    }

    let responseData = await packetJsonProcessor.processMessageOrError(
      mockedWS,
      JSON.stringify(requestData)
    )
    
    responseData = responseData.backMessages.at(0)

    assert.strictEqual(responseData, undefined)
  })

  after(async () => {
    await userRepo.deleteMany({})
  })
})
