import "../../index.js"

import ServiceLocatorContainer from "../../app/common/ServiceLocatorContainer.js"

import packetJsonProcessor from "../../APIs/JSON/routes/packet_processor.js"

const logger = ServiceLocatorContainer.use("Logger")
const organizationService = ServiceLocatorContainer.use("OrganizationService")

async function createOrganization(params) {
  params ??= { name: `${Math.random()}-${Math.random()}` }

  const newOrganization = await organizationService.create(params)

  return newOrganization
}

async function generateNewOrganizationId(params) {
  const newOrganization = await createOrganization(params)

  return newOrganization._id.toString()
}

async function sendLogin(ws, organizationId, login, device) {
  const requestData = {
    request: {
      user_login: {
        organization_id: organizationId,
        device_id: device || `${login}${Math.round(Math.random() * 10000)}`,
        login: login,
        password: "1um",
      },
      id: "UserLogin",
    },
  }

  const response = await packetJsonProcessor.processMessageOrError(ws, JSON.stringify(requestData))

  return response.backMessages.at(0)
}

async function sendLogout(ws, currentUserToken) {
  const requestData = {
    request: {
      user_logout: {},
      id: "UserLogout",
    },
  }

  await packetJsonProcessor.processMessageOrError(ws, JSON.stringify(requestData))
}

const mockedWS = {
  send: (data) => {
    logger.debug("[WS] send mocked data %j", data)
  },
}

async function createUserArray(organizationId, count, currentCountOfUsers, email, phone) {
  let usersIds = []

  for (let i = currentCountOfUsers || 0; i < count + (currentCountOfUsers || 0); i++) {
    const requestData = {
      request: {
        user_create: {
          organization_id: organizationId,
          login: `user_${i + 1}`,
          password: "1um",
          email: email || `email_${i}`,
          phone: phone || `phone_${i}`,
          device_id: "Computer",
        },
        id: "UserCreate",
      },
    }

    const createUserResponse = await packetJsonProcessor.processMessageOrError("UserCreate", JSON.stringify(requestData))

    usersIds[i] = createUserResponse?.backMessages?.at?.(0)?.response.user._id
  }

  return usersIds
}

async function createConversation(ws, name, description, type, participants) {
  if (!participants) {
    throw "participants missed"
  }

  const requestData = {
    request: {
      conversation_create: {
        name: name || "Chat",
        description: description || "Description",
        type: type || "g",
        participants,
      },
      id: "ConversationCreate",
    },
  }

  let responseData = await packetJsonProcessor.processMessageOrError(ws, JSON.stringify(requestData))

  responseData = responseData.backMessages.at(0)

  return responseData?.response.conversation._id.toString()
}

export { createOrganization, generateNewOrganizationId, sendLogin, sendLogout, createUserArray, createConversation, mockedWS }
