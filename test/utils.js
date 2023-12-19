import Minio from "./../app/lib/storage/minio.js";
import RedisClient from "../app/lib/redis.js";
import S3 from "./../app/lib/storage/s3.js";
import packetJsonProcessor from "../APIs/JSON/routes/packet_processor.js";

globalThis.storageClient =
  process.env.STORAGE_DRIVER === "minio" ? new Minio() : new S3();
await RedisClient.connect();

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

  const response = await packetJsonProcessor.processMessageOrError(
    ws,
    JSON.stringify(requestData)
  );

  return response.backMessages.at(0);
}

async function sendLogout(ws, currentUserToken) {
  const requestData = {
    request: {
      user_logout: {},
      id: "UserLogout",
    },
  };

  await packetJsonProcessor.processMessageOrError(ws, JSON.stringify(requestData));
}

const mockedWS = {
  send: (data) => {
    console.log("[WS] send mocked data", data);
  },
};

async function createUserArray(count, currentCountOfUsers, email, phone) {
  let usersIds = [];

  for (
    let i = currentCountOfUsers || 0;
    i < count + (currentCountOfUsers || 0);
    i++
  ) {
    const requestData = {
      request: {
        user_create: {
          login: `user_${i + 1}`,
          password: "1um",
          email: email || `email_${i}`,
          phone: phone || `phone_${i}`,
          deviceId: "Computer",
        },
        id: "UserCreate",
      },
    };

    const createUserResponse = await packetJsonProcessor.processMessageOrError(
      "UserCreate",
      JSON.stringify(requestData)
    )

    usersIds[i] = createUserResponse?.backMessages?.at?.(0)?.response.user._id;
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

  let responseData = await packetJsonProcessor.processMessageOrError(ws, JSON.stringify(requestData))

  responseData = responseData.backMessages.at(0)

  return responseData?.response.conversation._id.toString();
}

export { sendLogin, sendLogout, createUserArray, createConversation, mockedWS };
