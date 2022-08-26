import WebSocket from "ws";

const userCreate = {
  request: {
    user_create: {
      login: "user_1",
      password: "user_paswword_1",
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
let currentUserToken = "63077b407f8a5d9470d5e6e0";
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
      id: "63077ad836b78c3d82af0866",
    },
    id: "4",
  },
};

const callbacks = {};
const ws = new WebSocket(`ws://localhost:9001`);

ws.on("open", () => {
  console.log(`Connected`);
  // test_function(userCreate);

  test_function(userLogin);

  setTimeout(() => {
    test_function(userDelete);
  }, 7000);

  // setTimeout(() => {
  //   test_function(userLogout);
  // }, 2000);
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
