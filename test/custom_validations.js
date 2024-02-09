import Conversation from '../app/models/conversation.js'
import ConversationParticipant from '../app/models/conversation_participant.js'
import ServiceLocatorContainer from '../app/common/ServiceLocatorContainer.js'
import assert from 'assert'
import {
  createConversation,
  createUserArray,
  sendLogin,
  sendLogout,
} from './utils.js'
import {
  validateConversationsUserOwner,
  validateIsConversation,
  validateIsConversationByCID,
  validateIsUserAccess,
  validateIsUserSendHimSelf,
  validateParticipantsInUType,
  validateParticipantsLimit,
} from '../app/lib/validation.js'
import sessionRepository from '../app/repositories/session_repository.js'

let currentUserToken = ''
let usersIds = []
let currentConversationId = ''

async function assertThrowsAsync(fn, regExp) {
  let f = () => {}
  try {
    await fn()
  } catch (e) {
    f = () => {
      throw e
    }
  } finally {
    assert.throws(f, regExp)
  }
}

describe('Custom validate functions', async () => {
  before(async () => {
    usersIds = await createUserArray(3)
  })

  describe(' --> validateIsUserAccess', async () => {
    it('should work', async () => {
      currentUserToken = (await sendLogin('validate', 'user_1')).response.user
        .token
      const requestData = {
        name: 'validate',
        from: usersIds[0],
      }
      assert.strictEqual(
        validateIsUserAccess(requestData, 'validate'),
        undefined
      )
    })

    it('should fail', async () => {
      const requestData = {
        name: 'validate',
        from: usersIds[1],
      }
      assert.throws(
        () => {
          validateIsUserAccess(requestData, 'validate')
        },
        {
          name: 'Error',
          message: 'Forbidden.',
          cause: { status: 403, message: 'Forbidden.' },
        }
      )
      await sendLogout('validate', currentUserToken)
    })
  })

  describe(' --> validateConversationsUserOwner', async () => {
    it('should work', async () => {
      currentUserToken = (await sendLogin('validate', 'user_1')).response.user
        .token
      const requestData = {
        name: 'chat',
        owner_id: usersIds[0],
      }
      assert.strictEqual(
        validateConversationsUserOwner(requestData, 'validate'),
        undefined
      )
    })

    it('should fail', async () => {
      const requestData = {
        owner_id: usersIds[1],
      }
      assert.throws(
        () => {
          validateConversationsUserOwner(requestData, 'validate')
        },
        {
          name: 'Error',
          message: 'Forbidden.',
          cause: { status: 403, message: 'Forbidden.' },
        }
      )
      await sendLogout('validate', currentUserToken)
    })
  })

  describe(' --> validateIsConversation', async () => {
    before(async () => {
      currentUserToken = (await sendLogin('validate', 'user_1')).response.user
        .token

      currentConversationId = await createConversation(
        'validate',
        null,
        null,
        'g',
        [usersIds[1], usersIds[0]]
      )
    })

    after(async () => {
      await Conversation.clearCollection()
      await ConversationParticipant.clearCollection()
    })

    it('should work', async () => {
      const requestData = {
        id: currentConversationId,
      }
      assert.strictEqual(await validateIsConversation(requestData), undefined)
    })

    it('should fail #1', async () => {
      const requestData = {
        name: 'sad',
      }
      await assertThrowsAsync(
        async () => {
          await validateIsConversation(requestData)
        },
        {
          name: 'Error',
          message: 'Bad Request.',
          cause: { status: 400, message: 'Bad Request.' },
        }
      )
    })

    it('should fail #2', async () => {
      const requestData = {
        id: 'currentConversationId',
      }
      await assertThrowsAsync(
        async () => {
          await validateIsConversation(requestData)
        },
        {
          name: 'Error',
          message: 'Bad Request.',
          cause: { status: 400, message: 'Bad Request.' },
        }
      )
      await sendLogout('validate', currentUserToken)
    })
  })

  describe(' --> validateParticipantsLimit', async () => {
    it('should work', async () => {
      const requestData = 12
      assert.strictEqual(validateParticipantsLimit(requestData), undefined)
    })

    it('should fail', async () => {
      const requestData = 55
      assert.throws(
        () => {
          validateParticipantsLimit(requestData)
        },
        {
          name: 'Error',
          message: `You've reached the maximum participant limit.`,
          cause: {
            status: 422,
            message: `You've reached the maximum participant limit.`,
          },
        }
      )
    })
  })

  describe(' --> validateParticipantsInUType', async () => {
    it('should work', async () => {
      const requestData = {
        participants: [usersIds[0], usersIds[1]],
        opponent_id: usersIds[1],
      }
      assert.strictEqual(
        await validateParticipantsInUType(requestData),
        undefined
      )
    })

    it('should fail #1', async () => {
      const requestData = {
        participants: [usersIds[0], usersIds[1], 'id3', 'id4'],
        opponent_id: usersIds[1],
      }
      await assertThrowsAsync(
        async () => {
          await validateParticipantsInUType(requestData)
        },
        {
          name: 'Error',
          message: 'There are too many users in the private conversation.',
          cause: {
            status: 422,
            message: 'There are too many users in the private conversation.',
          },
        }
      )
    })

    it('should fail #2', async () => {
      const requestData = {
        participants: [usersIds[0], usersIds[1]],
      }
      await assertThrowsAsync(
        async () => {
          await validateParticipantsInUType(requestData)
        },
        {
          name: 'Error',
          message: 'Opponent ID not found.',
          cause: { status: 422, message: 'Opponent ID not found.' },
        }
      )
    })
  })

  describe(' --> validateIsConversationByCID', async () => {
    before(async () => {
      currentUserToken = (await sendLogin('validate', 'user_1')).response.user
        .token
      currentConversationId = await createConversation(
        'validate',
        null,
        null,
        'g',
        [usersIds[2], usersIds[0]]
      )
    })

    it('should work', async () => {
      const requestData = {
        cid: currentConversationId,
      }
      assert.strictEqual(
        await validateIsConversationByCID(requestData, 'validate'),
        undefined
      )
      await sendLogout('validate', currentUserToken)
    })

    it('should fail #1', async () => {
      currentUserToken = (await sendLogin('validate', 'user_2')).response.user
        .token
      const requestData = {
        cid: currentConversationId,
      }
      await assertThrowsAsync(
        async () => {
          await validateIsConversationByCID(requestData, 'validate')
        },
        {
          name: 'Error',
          message: 'Forbidden.',
          cause: { status: 403, message: 'Forbidden.' },
        }
      )
      await sendLogout('validate', currentUserToken)
    })

    it('should fail #2', async () => {
      const requestData = {
        cid: 'asd',
      }
      await assertThrowsAsync(
        async () => {
          await validateIsConversationByCID(requestData, 'validate')
        },
        {
          name: 'Error',
          message: 'Conversation not found.',
          cause: { status: 404, message: 'Conversation not found.' },
        }
      )
    })

    it('should fail #3', async () => {
      const requestData = {
        name: '123',
      }
      await assertThrowsAsync(
        async () => {
          await validateIsConversationByCID(requestData, 'validate')
        },
        {
          name: 'Error',
          message: 'Conversation not found.',
          cause: { status: 404, message: 'Conversation not found.' },
        }
      )
      await sendLogout('validate', currentUserToken)
    })

    after(async () => {
      await Conversation.clearCollection()
      await ConversationParticipant.clearCollection()
    })
  })

  describe(' --> validateIsUserSendHimSelf', async () => {
    it('should work', async () => {
      currentUserToken = (await sendLogin('validate', 'user_1')).response.token
      const requestData = {
        opponent_id: usersIds[1],
      }
      assert.strictEqual(
        await validateIsUserSendHimSelf(requestData, 'validate'),
        undefined
      )
    })

    it('should fail #1', async () => {
      const requestData = {
        opponent_id: usersIds[0],
      }
      await assertThrowsAsync(
        async () => {
          await validateIsUserSendHimSelf(requestData, 'validate')
        },
        {
          name: 'Error',
          message: 'The specified user is incorrect.',
          cause: { status: 422, message: 'The specified user is incorrect.' },
        }
      )
      await sendLogout('validate', currentUserToken)
    })
  })

  after(async () => {
    const userRepo = ServiceLocatorContainer.use('UserRepository')
    await userRepo.deleteMany({})
    await Conversation.clearCollection()
    await ConversationParticipant.clearCollection()
    await sessionRepository.dropUserNodeDataBase()
  })
})
