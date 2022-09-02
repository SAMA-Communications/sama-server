import WebSocket from "ws";

const userCreate = {
  request: {
    user_create: {
      login: "user_1",
      password: "password",
    },

    id: "1",
  },
};
const userLogin = {
  request: {
    user_login: {
      login: "user_2",
      password: "password",
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
      name: "chat5",
      description: "for admin and users",
      participants: ["630f2f82adae404310b77369"],
    },
    id: "5",
  },
};
const conversationsDelete = {
  request: {
    conversation_delete: {
      id: "630f1d007ab4ed1a72a78a6a",
    },
    id: "5",
  },
};
const conversationUpdate = {
  request: {
    conversation_update: {
      id: "630f33ba45c3075f033e46f6",
      name: "name2",
      description: "description_tes22",
      participants: {
        // add: ["630f2f899b31eedac2d0fe0f", "630f2f8e53417a40653ad5a0"],
        // remove: ["630f2f82adae404310b77369", "630f316e96c0aa6436006aa5"],
        // add: ["630f2f82adae404310b77369", "630f316e96c0aa6436006aa5"],
        // remove: ["630f2f899b31eedac2d0fe0f", "630f2f8e53417a40653ad5a0"],
      },
    },
    id: "6",
  },
};
const conversationList = {
  request: {
    conversation_list: {
      limit: 2,
      // updated_at: {
      //   gt: "2022-09-01T07:06:02.715+00:00",
      // },
    },
    id: "7",
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

  // setTimeout(() => {
  //   test_function(conversationsDelete);
  // }, 2000);

  // setTimeout(() => {
  //   test_function(userLogout);
  // }, 5000);

  // setTimeout(() => {
  //   test_function(conversationUpdate);
  // }, 3000);

  setTimeout(() => {
    test_function(conversationList);
  }, 3000);
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
