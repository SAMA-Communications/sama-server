import { default as PacketProcessor } from "./../app/routes/delivery_manager.js";

async function sendLogin(ws, login, device) {
  const requestData = {
    request: {
      user_login: {
        deviceId: device || `${login}${Math.round(Math.random() * 10000)}`,
        login: login,
        password: "1um",
      },
      id: "UserLogin",
    },
  };
  const response = await PacketProcessor.processJsonMessageOrError(
    ws,
    requestData
  );
  return response;
}

async function sendLogout(ws, currentUserToken) {
  const requestData = {
    request: {
      user_logout: {},
      id: "UserLogout",
    },
  };
  await PacketProcessor.processJsonMessageOrError(ws, requestData);
}

const mockedWS = {
  send: (data) => {
    console.log("[WS] send mocked data", data);
  },
};

async function createUserArray(count) {
  let usersIds = [];

  for (let i = 0; i < count; i++) {
    const requestData = {
      request: {
        user_create: {
          login: `user_${i + 1}`,
          password: "1um",
          deviceId: "Computer",
        },
        id: "UserCreate",
      },
    };

    usersIds[i] = (
      await PacketProcessor.processJsonMessageOrError("UserCreate", requestData)
    )?.response.user._id;
  }

  return usersIds;
}

async function createConversation(ws, name, description, type, participants) {
  if (!participants) {
    throw "participants missed";
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
  };

  return (
    await PacketProcessor.processJsonMessageOrError(ws, requestData)
  )?.response.conversation._id.toString();
}

export { sendLogin, sendLogout, createUserArray, createConversation, mockedWS };
