import WebSocket from "ws";

const userCreate = {
  request: {
    user_create: {
      login: "user_3",
      password: "user_paswword_3",
    },
    id: "1",
  },
};
const userLogin = {
  request: {
    user_login: {
      login: "user_1",
      password: "user_paswword_1",
    },
    id: "2",
  },
};
let currentUserToken = "630c7abc9f8699cccb6eda98";
let userLogout = {
  request: {
    user_logout: {
      token: currentUserToken,
    },
    id: "3",
  },
};
const userDelete = {
  request: {
    user_delete: {
      id: "630cc582a9bd13ced3cdeefc",
    },
    id: "4",
  },
};
const conversationsCreate = {
  request: {
    conversation_create: {
      name: "chat_1",
      description: "for admin and users",
      participants: ["6308c177b2c69c02e27e9686", "630c7abc9f8699cccb6eda98"],
    },
    id: "5",
  },
};
const conversationsDelete = {
  request: {
    conversation_delete: {
      id: "630dde18623f25670a6bba2c",
    },
    id: "5",
  },
};

const callbacks = {};
const ws = new WebSocket(`ws://localhost:9001`);

ws.on("open", () => {
  console.log(`Connected`);
  // test_function(userCreate);

  test_function(userLogin);

  // setTimeout(() => {
  //   test_function(userDelete);
  // }, 7000);

  // setTimeout(() => {
  //   test_function(conversationsCreate);
  // }, 2000);

  setTimeout(() => {
    test_function(conversationsDelete);
  }, 2000);

  // setTimeout(() => {
  //   test_function(userLogout);
  // }, 5000);
});

ws.on("message", (message) => {
  const data = JSON.parse(message);
  const id = data.response.id;

  if (typeof callbacks[id] === "function") {
    callbacks[id](data);
    delete callbacks[id];
  } else {
    console.log(`[Server] --- on message: \n`, data);
  }
});

function test_function(data) {
  callbacks[data.request.id] = (responseData) => {
    console.log(responseData);
  };
  ws.send(JSON.stringify(data));
}
